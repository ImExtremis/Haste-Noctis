#!/bin/bash
# Copyright (C) 2026 Noctis Contributors
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Noctis Setup Script
# Idempotent bootstrap for Ubuntu 22.04/24.04 and macOS (Apple Silicon + Intel).
# Run from the repository root.
#
# Usage: bash scripts/setup.sh [--skip-rust] [--skip-services]

set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[NOCTIS]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
log_error()   { echo -e "${RED}[✗]${NC} $1" >&2; exit 1; }
log_step()    { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}"; }

# ─── Argument parsing ─────────────────────────────────────────────────────────
SKIP_RUST=false
SKIP_SERVICES=false
for arg in "$@"; do
  case "$arg" in
    --skip-rust)     SKIP_RUST=true ;;
    --skip-services) SKIP_SERVICES=true ;;
  esac
done

# ─── Locate repo root ─────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"
log_info "Repository root: $REPO_ROOT"

# ─── Track progress ───────────────────────────────────────────────────────────
WARNINGS=()
ERRORS=()

add_warning() { WARNINGS+=("$1"); }
record_error() { ERRORS+=("$1"); }

# ─── Detect OS ────────────────────────────────────────────────────────────────
detect_os() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    ARCH="$(uname -m)"
  elif [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS="linux"
    DISTRO="$ID"
    DISTRO_VERSION="${VERSION_ID:-unknown}"
  else
    log_error "Unsupported operating system. This script supports Ubuntu 22.04/24.04 and macOS."
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Node.js version check
# ─────────────────────────────────────────────────────────────────────────────
check_node_version() {
  log_step "Step 1: Node.js Version Check"

  if ! command -v node &>/dev/null; then
    log_error "Node.js is not installed. Install Node.js 24 via https://nodejs.org or nvm."
  fi

  NODE_VERSION="$(node --version)"         # e.g. v24.1.0
  NODE_MAJOR="${NODE_VERSION#v}"
  NODE_MAJOR="${NODE_MAJOR%%.*}"

  REQUIRED_MAJOR="24"
  if [[ "$NODE_MAJOR" -lt "$REQUIRED_MAJOR" ]]; then
    log_error "Node.js $NODE_VERSION is too old. Noctis requires Node.js v24+.
  Install Node.js 24: curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  Or use nvm:         nvm install 24 && nvm use 24"
  fi

  log_success "Node.js $NODE_VERSION (major: $NODE_MAJOR) ✓"
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: System dependencies
# ─────────────────────────────────────────────────────────────────────────────
check_system_dependencies() {
  log_step "Step 2: System Dependencies"

  MISSING=()

  check_cmd() {
    local cmd="$1"
    local pkg="$2"
    if ! command -v "$cmd" &>/dev/null; then
      log_warn "Missing: $cmd (install with: $pkg)"
      MISSING+=("$cmd")
    else
      log_success "$cmd found: $(command -v "$cmd")"
    fi
  }

  check_cmd git    "sudo apt-get install -y git                  (or brew install git)"
  check_cmd python3 "sudo apt-get install -y python3             (or brew install python3)"
  check_cmd make   "sudo apt-get install -y make build-essential (or xcode-select --install)"
  check_cmd jq     "sudo apt-get install -y jq                   (or brew install jq)"
  check_cmd openssl "sudo apt-get install -y openssl             (or brew install openssl)"
  check_cmd curl   "sudo apt-get install -y curl                 (or brew install curl)"

  # GCC / Clang for native addons (argon2, sharp, etc.)
  if [[ "$OS" == "linux" ]]; then
    if ! command -v gcc &>/dev/null && ! command -v cc &>/dev/null; then
      log_warn "Missing: gcc (install with: sudo apt-get install -y build-essential)"
      MISSING+=("gcc")
    else
      log_success "C compiler found: $(command -v gcc 2>/dev/null || command -v cc)"
    fi
  elif [[ "$OS" == "macos" ]]; then
    if ! xcode-select -p &>/dev/null; then
      log_warn "Xcode Command Line Tools not installed. Run: xcode-select --install"
      MISSING+=("xcode-select")
    else
      log_success "Xcode CLT found"
    fi
  fi

  if [[ ${#MISSING[@]} -gt 0 ]]; then
    log_warn "Some system dependencies are missing: ${MISSING[*]}"
    log_warn "Running 'pnpm install' may fail for native packages (argon2, sharp, etc.)"
    add_warning "Missing system deps: ${MISSING[*]}"
  else
    log_success "All required system tools present"
  fi

  # Rust/wasm-pack check (optional — needed for frontier WASM build in apps/web)
  if [[ "$SKIP_RUST" == "true" ]]; then
    log_warn "Skipping Rust/wasm-pack check (--skip-rust flag set)"
    add_warning "Skipped Rust check. 'pnpm wasm:codegen' will fail if wasm-pack is missing."
  else
    if command -v rustup &>/dev/null && command -v cargo &>/dev/null; then
      log_success "Rust toolchain found: $(rustc --version)"
    else
      log_warn "Rust not found. The 'apps/web' WASM build (wasm-pack) requires Rust."
      log_warn "Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
      add_warning "Rust not installed. pnpm wasm:codegen will fail."
    fi

    if command -v wasm-pack &>/dev/null; then
      log_success "wasm-pack found: $(wasm-pack --version)"
    else
      log_warn "wasm-pack not found. Install: cargo install wasm-pack  (or: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh)"
      add_warning "wasm-pack not installed."
    fi
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Package manager (pnpm)
# ─────────────────────────────────────────────────────────────────────────────
check_package_manager() {
  log_step "Step 3: Package Manager (pnpm)"

  REQUIRED_PNPM="10.29.3"

  if ! command -v pnpm &>/dev/null; then
    log_warn "pnpm not found. Installing via corepack..."
    if command -v corepack &>/dev/null; then
      corepack enable
      corepack prepare "pnpm@$REQUIRED_PNPM" --activate
    elif command -v npm &>/dev/null; then
      npm install -g "pnpm@$REQUIRED_PNPM"
    else
      log_error "Neither corepack nor npm is available to install pnpm."
    fi
  fi

  PNPM_VERSION="$(pnpm --version)"
  PNPM_MAJOR="${PNPM_VERSION%%.*}"

  if [[ "$PNPM_MAJOR" -lt 10 ]]; then
    log_error "pnpm $PNPM_VERSION is too old. Noctis requires pnpm 10+.
  The lockfile format for pnpm 10 is incompatible with pnpm 9.
  Upgrade: corepack prepare pnpm@$REQUIRED_PNPM --activate
        or: npm install -g pnpm@$REQUIRED_PNPM"
  fi

  log_success "pnpm $PNPM_VERSION ✓"

  if [[ "$PNPM_VERSION" != "$REQUIRED_PNPM" ]]; then
    add_warning "pnpm $PNPM_VERSION installed, workspace expects $REQUIRED_PNPM. Consider: corepack prepare pnpm@$REQUIRED_PNPM --activate"
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: Install dependencies (all workspaces)
# ─────────────────────────────────────────────────────────────────────────────
install_dependencies() {
  log_step "Step 4: Installing Dependencies"

  log_info "Running pnpm install across all workspaces..."
  log_info "(This may take several minutes on first run — argon2/sharp compile native modules)"

  if pnpm install --frozen-lockfile 2>&1; then
    log_success "pnpm install completed"
  else
    log_warn "pnpm install with --frozen-lockfile failed. Trying without --frozen-lockfile..."
    if pnpm install 2>&1; then
      log_success "pnpm install completed (lockfile updated)"
      add_warning "Lockfile was updated during install. Please review and commit changes."
    else
      log_error "pnpm install failed. Check the error above."
    fi
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5: mediasoup worker build
# ─────────────────────────────────────────────────────────────────────────────
check_mediasoup() {
  log_step "Step 5: mediasoup Check"

  if ! grep -r '"mediasoup"' "$REPO_ROOT/packages" "$REPO_ROOT/apps" "$REPO_ROOT/noctis_server" \
       --include="package.json" -l &>/dev/null 2>&1; then
    log_info "mediasoup is not installed in this project. Skipping worker build."
    log_info "(Project currently uses LiveKit for voice/video)"
    return 0
  fi

  log_info "mediasoup detected — checking build requirements..."
  BUILD_FAILED=false

  for cmd in python3 make; do
    if ! command -v "$cmd" &>/dev/null; then
      log_error "mediasoup requires '$cmd' but it's not installed.
  Ubuntu: sudo apt-get install -y build-essential python3 make g++
  macOS:  xcode-select --install"
    fi
  done

  GCC_OK=false
  if command -v gcc &>/dev/null || command -v g++ &>/dev/null || command -v clang &>/dev/null; then
    GCC_OK=true
  fi

  if [[ "$GCC_OK" == "false" ]]; then
    log_error "mediasoup requires a C++ compiler (gcc, g++, or clang)."
  fi

  log_info "Building mediasoup workers (C++ compilation — this takes 2-5 minutes)..."

  MEDIASOUP_PKG_DIR=""
  for dir in "$REPO_ROOT/packages" "$REPO_ROOT/apps"; do
    found=$(find "$dir" -name "package.json" -exec grep -l '"mediasoup"' {} \; 2>/dev/null | head -1 || true)
    if [[ -n "$found" ]]; then
      MEDIASOUP_PKG_DIR="$(dirname "$found")"
      break
    fi
  done

  if [[ -n "$MEDIASOUP_PKG_DIR" ]]; then
    if MEDIASOUP_SKIP_WORKER_PREBUILT_DOWNLOAD=false \
       npx --prefix "$MEDIASOUP_PKG_DIR" mediasoup-worker-prebuild 2>&1 || \
       pnpm rebuild mediasoup 2>&1; then
      log_success "mediasoup workers built"
    else
      record_error "mediasoup worker build failed. Check C++ toolchain."
    fi
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6: Environment / config setup
# ─────────────────────────────────────────────────────────────────────────────
setup_env() {
  log_step "Step 6: Environment Config Setup"

  # .env for Docker Compose
  if [[ ! -f "$REPO_ROOT/.env" ]]; then
    if [[ -f "$REPO_ROOT/.env.example" ]]; then
      cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
      log_success "Copied .env.example → .env"
    else
      log_warn ".env.example not found. Creating minimal .env..."
      {
        echo "# Noctis Docker Compose Environment"
        echo "# Generated by setup.sh on $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
        echo ""
        echo "# Required for Meilisearch"
        echo "MEILI_MASTER_KEY=$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
        echo ""
        echo "# Optional port overrides"
        echo "# NOCTIS_HTTP_PORT=8080"
        echo "# MEILI_PORT=7700"
      } > "$REPO_ROOT/.env"
      log_success "Created .env with generated MEILI_MASTER_KEY"
    fi
  else
    log_success ".env already exists — not overwriting"

    # Ensure MEILI_MASTER_KEY exists in the file
    if ! grep -q "MEILI_MASTER_KEY" "$REPO_ROOT/.env"; then
      log_warn "MEILI_MASTER_KEY missing from .env. Adding..."
      echo "MEILI_MASTER_KEY=$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")" >> "$REPO_ROOT/.env"
      log_success "MEILI_MASTER_KEY added to .env"
    fi
  fi

  # Application config.json
  CONFIG_PATH="${NOCTIS_CONFIG:-$REPO_ROOT/config/config.json}"
  TEMPLATE_PATH="$REPO_ROOT/config/config.dev.template.json"

  if [[ ! -f "$CONFIG_PATH" ]]; then
    if [[ -f "$TEMPLATE_PATH" ]]; then
      cp "$TEMPLATE_PATH" "$CONFIG_PATH"
      log_success "Created config.json from development template"
      log_info "Running dev_bootstrap.sh to seed secrets..."
      if bash "$REPO_ROOT/scripts/dev_bootstrap.sh" 2>&1; then
        log_success "Development secrets seeded via dev_bootstrap.sh"
      else
        add_warning "dev_bootstrap.sh returned non-zero. Config may need manual review."
      fi
    else
      log_warn "No config.json template found. App will not start without $CONFIG_PATH"
      add_warning "config.json is missing — copy from config/config.dev.template.json and run dev_bootstrap.sh"
    fi
  else
    log_success "config.json already exists at $CONFIG_PATH"
    log_info "Running dev_bootstrap.sh to verify/refresh secrets..."
    if bash "$REPO_ROOT/scripts/dev_bootstrap.sh" 2>&1; then
      log_success "Development secrets verified"
    else
      add_warning "dev_bootstrap.sh returned non-zero. Secrets may need manual review."
    fi
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7: Prisma generate + migrate
# ─────────────────────────────────────────────────────────────────────────────
setup_prisma() {
  log_step "Step 7: ORM / Schema Check"

  # This project does NOT use Prisma - it uses Cassandra + SQLite
  if command -v pnpm &>/dev/null && pnpm list prisma --depth 0 &>/dev/null 2>&1; then
    log_info "Prisma detected — running generate..."
    pnpm exec prisma generate && log_success "Prisma generate completed"
  else
    log_info "Prisma is not used in this project. Database schema is managed via Cassandra/SQLite."
    log_info "Schema types are defined in packages/schema."
  fi

  # Generate config schema (Noctis-specific code generation)
  if [[ -f "$REPO_ROOT/packages/config/package.json" ]]; then
    log_info "Generating @noctis/config schema..."
    if NOCTIS_CONFIG="${NOCTIS_CONFIG:-$REPO_ROOT/config/config.json}" \
       pnpm --filter @noctis/config run generate 2>&1; then
      log_success "@noctis/config schema generated"
    else
      add_warning "@noctis/config generate failed. This may cause typecheck errors."
    fi
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 8: TypeScript check
# ─────────────────────────────────────────────────────────────────────────────
typecheck() {
  log_step "Step 8: TypeScript Verification"

  log_warn "Running typecheck on noctis_server only (fastest signal)..."
  log_warn "Full monorepo typecheck: pnpm turbo run typecheck"

  if NOCTIS_CONFIG="${NOCTIS_CONFIG:-$REPO_ROOT/config/config.json}" \
     pnpm --filter noctis_server typecheck 2>&1; then
    log_success "TypeScript check passed for noctis_server"
  else
    record_error "TypeScript errors detected in noctis_server. Run 'pnpm typecheck' for details."
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 9: Service connectivity checks
# ─────────────────────────────────────────────────────────────────────────────
check_services() {
  log_step "Step 9: Service Connectivity"

  if [[ "$SKIP_SERVICES" == "true" ]]; then
    log_info "Skipping service checks (--skip-services flag set)"
    return 0
  fi

  CONFIG_PATH="${NOCTIS_CONFIG:-$REPO_ROOT/config/config.json}"

  # Check Redis/Valkey
  if [[ -f "$CONFIG_PATH" ]]; then
    KV_URL=$(jq -r '.internal.kv // empty' "$CONFIG_PATH" 2>/dev/null || true)
    if [[ -n "$KV_URL" ]]; then
      log_info "Checking Valkey/Redis: $KV_URL"
      # Extract host and port from redis://host:port/db
      KV_HOST="${KV_URL#redis://}"
      KV_HOST="${KV_HOST%/*}"
      KV_PORT="${KV_HOST##*:}"
      KV_HOST="${KV_HOST%:*}"
      KV_PORT="${KV_PORT:-6379}"

      if command -v nc &>/dev/null; then
        if nc -z -w3 "$KV_HOST" "$KV_PORT" &>/dev/null 2>&1; then
          log_success "Valkey/Redis reachable at $KV_HOST:$KV_PORT"
        else
          log_warn "Valkey/Redis NOT reachable at $KV_HOST:$KV_PORT"
          log_warn "Start with: docker compose up -d valkey"
          add_warning "Valkey not reachable — start with: docker compose up -d valkey"
        fi
      else
        log_info "(nc not available — skipping Redis port check)"
      fi
    fi
  fi

  # Check Docker Compose services
  if command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1; then
    log_info "Docker Compose available: $(docker compose version --short 2>/dev/null || echo 'unknown')"

    RUNNING=$(docker compose ps --status running --format json 2>/dev/null | \
               python3 -c "import sys, json; data=sys.stdin.read(); \
               rows=[r.get('Service','?') for r in json.loads(data)] if data.strip().startswith('[') \
               else [json.loads(l).get('Service','?') for l in data.splitlines() if l.strip()]; \
               print(', '.join(rows) or 'none')" 2>/dev/null || echo "unknown")

    log_info "Running compose services: $RUNNING"
  else
    log_info "Docker Compose not available — skipping container checks"
  fi

  # Check Meilisearch
  if [[ -f "$CONFIG_PATH" ]]; then
    MEILI_URL=$(jq -r '.integrations.search.url // empty' "$CONFIG_PATH" 2>/dev/null || true)
    if [[ -n "$MEILI_URL" ]]; then
      if curl -sf --max-time 3 "${MEILI_URL}/health" &>/dev/null; then
        log_success "Meilisearch reachable at $MEILI_URL"
      else
        log_warn "Meilisearch NOT reachable at $MEILI_URL"
        log_warn "Start with: docker compose --profile search up -d meilisearch"
        add_warning "Meilisearch not reachable (optional search service)"
      fi
    fi
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# STEP 10: Final summary
# ─────────────────────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${CYAN}   Noctis Setup Summary                               ${NC}"
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if [[ ${#ERRORS[@]} -eq 0 && ${#WARNINGS[@]} -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}  ✓ Setup completed successfully with no issues!${NC}"
  elif [[ ${#ERRORS[@]} -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}  ✓ Setup completed with warnings (review below)${NC}"
  else
    echo -e "${RED}${BOLD}  ✗ Setup completed with ERRORS (review below)${NC}"
  fi

  if [[ ${#WARNINGS[@]} -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}  Warnings:${NC}"
    for w in "${WARNINGS[@]}"; do
      echo -e "  ${YELLOW}⚠${NC}  $w"
    done
  fi

  if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}  Errors:${NC}"
    for e in "${ERRORS[@]}"; do
      echo -e "  ${RED}✗${NC}  $e"
    done
  fi

  echo ""
  echo -e "  ${CYAN}Next steps:${NC}"
  echo -e "  1. Start infrastructure:  ${BOLD}docker compose up -d valkey${NC}"
  echo -e "  2. Start dev server:      ${BOLD}pnpm dev${NC}"
  echo -e "  3. Run tests:             ${BOLD}pnpm turbo run test${NC}"
  echo -e "  4. Full typecheck:        ${BOLD}pnpm turbo run typecheck${NC}"
  echo ""

  if [[ ${#ERRORS[@]} -gt 0 ]]; then
    exit 1
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
main() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${CYAN}║         Noctis Project Setup Script              ║${NC}"
  echo -e "${BOLD}${CYAN}║   Supports: Ubuntu 22.04/24.04, macOS (ARM/Intel)║${NC}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""

  detect_os
  check_node_version
  check_system_dependencies
  check_package_manager
  install_dependencies
  check_mediasoup
  setup_env
  setup_prisma
  typecheck
  check_services
  print_summary
}

main "$@"
