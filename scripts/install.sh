#!/bin/bash
set -euo pipefail

exec > >(tee -a /tmp/noctis-install.log) 2>&1

log_info()    { echo -e "\033[0;36m[NOCTIS]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[✓]\033[0m $1"; }
log_warn()    { echo -e "\033[1;33m[!]\033[0m $1"; }
log_error()   { echo -e "\033[0;31m[✗] ERROR:\033[0m $1\nTo get help:\n• Check logs: docker compose logs\n• Review: /tmp/noctis-install.log\n• Support: support.noctis.app"; exit 1; }

cat << "EOF"
╔══════════════════════════════════════════════════════╗
║           NOCTIS — Auto Deploy Script                ║
║           A Haste Industries Product                 ║
║           Version 1.0 | Phase 1                      ║
╚══════════════════════════════════════════════════════╝
EOF

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

function pre_flight_checks() {
  log_info "Running system checks..."

  if ! grep -qiE 'ubuntu 22\.04|ubuntu 24\.04|kali' /etc/os-release; then
    log_error "This script currently only supports Ubuntu (22.04/24.04) and Kali Linux."
  fi

  if [ "$EUID" -ne 0 ]; then
    log_error "Please run with sudo: sudo bash scripts/install.sh"
  fi

  ping -c 1 1.1.1.1 >/dev/null 2>&1 || log_error "No internet connectivity detected. Please check network settings."

  local free_kb
  free_kb=$(df -k / | awk 'NR==2 {print $4}')
  if [ "$free_kb" -lt 10485760 ]; then
     log_warn "Less than 10GB free disk space."
     read -p "Proceed anyway? (y/n): " ans
     [[ "$ans" != "y" && "$ans" != "yes" ]] && log_error "Installation cancelled by user."
  fi

  local ram_kb
  ram_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  if [ "$ram_kb" -lt 1000000 ]; then
     log_error "Less than 1GB RAM detected. Aborting."
  elif [ "$ram_kb" -lt 2000000 ]; then
     log_warn "Less than 2GB RAM detected. Performance may be degraded."
  fi
  
  if ss -tlnp 2>/dev/null | grep -q ":80 " || ss -tlnp 2>/dev/null | grep -q ":443 "; then
     log_warn "Port 80 or 443 is already in use. You may need to stop Apache/Nginx or configure a reverse proxy."
     read -p "Proceed anyway? (y/n): " ans
     [[ "$ans" != "y" && "$ans" != "yes" ]] && log_error "Installation cancelled."
  fi
}

function collect_configuration() {
  echo ""
  echo "Configuration:"
  
  read -p "[1/6] Server domain or IP address (e.g. noctis.example.com): " CONF_HOST
  while [ -z "$CONF_HOST" ]; do read -p "      > " CONF_HOST; done

  read -p "[2/6] App port (default: 8080): " CONF_PORT
  CONF_PORT=${CONF_PORT:-8080}

  read -p "[3/6] Admin email address: " ADMIN_EMAIL
  while [ -z "$ADMIN_EMAIL" ]; do read -p "      > " ADMIN_EMAIL; done

  read -s -p "[4/6] Admin password (>12 chars): " ADMIN_PASSWORD; echo ""
  while [ ${#ADMIN_PASSWORD} -lt 12 ]; do 
    echo "Password must be at least 12 characters."
    read -s -p "      > " ADMIN_PASSWORD; echo ""
  done

  read -p "[5/6] Meilisearch master key (Press Enter to auto-generate): " MEILI_KEY_INPUT

  read -p "[6/6] Enable voice/video? (yes/no, default: yes): " ENABLE_VOICE
  ENABLE_VOICE=${ENABLE_VOICE:-yes}
  if [[ "$ENABLE_VOICE" != "yes" && "$ENABLE_VOICE" != "no" ]]; then ENABLE_VOICE="yes"; fi

  if ss -tlnp 2>/dev/null | grep -q ":${CONF_PORT} "; then
     log_error "Port $CONF_PORT is already in use. Aborting."
  fi
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Configuration Summary"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Host:        $CONF_HOST:$CONF_PORT"
  echo "  Admin email: $ADMIN_EMAIL"
  echo "  Search:      enabled"
  echo "  Voice/Video: $ENABLE_VOICE"
  if [ -z "$MEILI_KEY_INPUT" ]; then
    echo "  Meili key:   [auto-generated]"
  else
    echo "  Meili key:   [provided]"
  fi
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  read -p "Proceed with installation? (yes/no) > " proceed
  [[ "$proceed" != "yes" && "$proceed" != "y" ]] && { echo "Installation cancelled."; exit 0; }
  
  log_info "Installation started on $(date)"
}

function install_prerequisites() {
  log_info "Installing system packages..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y \
    curl \
    wget \
    git \
    gnupg \
    ca-certificates \
    lsb-release \
    apt-transport-https \
    software-properties-common \
    ufw \
    jq \
    build-essential \
    python3 \
    make \
    openssl \
    net-tools

  log_info "Installing Node.js 24..."
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
  
  if ! node -v | grep -q "v24."; then
    log_error "Node.js 24 was not installed properly."
  fi

  log_info "Installing pnpm..."
  corepack enable
  corepack prepare pnpm@10.29.3 --activate
  if ! pnpm -v | grep -q "^10."; then
    log_error "pnpm 10.x was not installed properly."
  fi

  log_info "Installing Rust and Cargo..."
  if ! command -v cargo >/dev/null 2>&1; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
  fi
  if ! cargo --version >/dev/null 2>&1; then
    log_error "Rust/Cargo installation failed."
  fi

  log_info "Installing Docker..."
  if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | bash
  fi
  
  if [ -n "${SUDO_USER:-}" ]; then
    usermod -aG docker "$SUDO_USER" || true
  fi
  
  systemctl enable docker && systemctl start docker
  docker info >/dev/null 2>&1 || log_error "Docker is not running."

  apt-get install -y docker-compose-plugin
  docker compose version >/dev/null 2>&1 || log_error "Docker Compose V2 is not installed."

  log_success "System packages installed"
}

function configure_firewall() {
  log_info "Configuring UFW firewall..."
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow ssh
  ufw allow 22/tcp
  ufw allow "$CONF_PORT/tcp"

  if [ "$ENABLE_VOICE" = "yes" ]; then
    ufw allow 7880/tcp
    ufw allow 7881/tcp
    ufw allow 50000:50019/udp
  fi
  
  ufw --force enable
  ufw status
  log_success "UFW firewall configured"
}

function generate_secrets() {
  log_info "Generating cryptographic secrets..."
  JWT_SECRET=$(openssl rand -base64 48)
  REFRESH_SECRET=$(openssl rand -base64 48)
  SESSION_SECRET=$(openssl rand -base64 32)
  LIVEKIT_API_KEY="noctis-$(openssl rand -hex 8)"
  LIVEKIT_API_SECRET=$(openssl rand -base64 48)

  if [ -z "$MEILI_KEY_INPUT" ]; then
    MEILI_MASTER_KEY=$(openssl rand -hex 32)
  else
    MEILI_MASTER_KEY="$MEILI_KEY_INPUT"
  fi
  
  MEDIA_PROXY_SECRET_KEY=$(openssl rand -hex 32)
  ADMIN_SECRET_KEY_BASE=$(openssl rand -hex 32)
  ADMIN_OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)
  GATEWAY_ADMIN_RELOAD_SECRET=$(openssl rand -hex 32)
  SUDO_MODE_SECRET=$(openssl rand -hex 32)
  CONNECTION_INITIATION_SECRET=$(openssl rand -hex 32)
  
  log_success "Secrets generated"
}

function write_env_file() {
  log_info "Writing .env file..."
  
  # Create config template if missing
  mkdir -p config
  if [ ! -f config/config.json ]; then
    if [ -f config/config.production.template.json ]; then
      cp config/config.production.template.json config/config.json
    elif [ -f config/config.dev.template.json ]; then
      cp config/config.dev.template.json config/config.json
    fi
  fi
  
  cat > .env <<EOF
# Noctis Configuration
# Generated by install.sh on $(date)
# DO NOT COMMIT THIS FILE TO GIT
# DO NOT SHARE THIS FILE

MEILI_MASTER_KEY=${MEILI_MASTER_KEY}
NOCTIS_HTTP_PORT=${CONF_PORT}
LIVEKIT_PORT=7880
MEILI_PORT=7700
ELASTICSEARCH_PORT=9200

# Security Secrets (for scripts to pick up)
JWT_SECRET=${JWT_SECRET}
REFRESH_SECRET=${REFRESH_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# Environment overrides mapping directly to ConfigLoader
NOCTIS_CONFIG__DOMAIN__BASE_DOMAIN=${CONF_HOST}
NOCTIS_CONFIG__DOMAIN__PUBLIC_PORT=${CONF_PORT}
NOCTIS_CONFIG__DATABASE__BACKEND=sqlite
NOCTIS_CONFIG__DATABASE__SQLITE_PATH=/usr/src/app/data/noctis.db

NOCTIS_CONFIG__SERVICES__ADMIN__SECRET_KEY_BASE=${ADMIN_SECRET_KEY_BASE}
NOCTIS_CONFIG__SERVICES__ADMIN__OAUTH_CLIENT_SECRET=${ADMIN_OAUTH_CLIENT_SECRET}
NOCTIS_CONFIG__SERVICES__MEDIA_PROXY__SECRET_KEY=${MEDIA_PROXY_SECRET_KEY}
NOCTIS_CONFIG__SERVICES__GATEWAY__ADMIN_RELOAD_SECRET=${GATEWAY_ADMIN_RELOAD_SECRET}

NOCTIS_CONFIG__AUTH__SUDO_MODE_SECRET=${SUDO_MODE_SECRET}
NOCTIS_CONFIG__AUTH__CONNECTION_INITIATION_SECRET=${CONNECTION_INITIATION_SECRET}

NOCTIS_CONFIG__INTEGRATIONS__SEARCH__ENGINE=meilisearch
NOCTIS_CONFIG__INTEGRATIONS__SEARCH__URL=http://meilisearch:7700
NOCTIS_CONFIG__INTEGRATIONS__SEARCH__API_KEY=${MEILI_MASTER_KEY}

EOF

  if [ "$ENABLE_VOICE" = "yes" ]; then
    cat >> .env <<EOF
NOCTIS_CONFIG__INTEGRATIONS__VOICE__ENABLED=true
NOCTIS_CONFIG__INTEGRATIONS__VOICE__API_KEY=${LIVEKIT_API_KEY}
NOCTIS_CONFIG__INTEGRATIONS__VOICE__API_SECRET=${LIVEKIT_API_SECRET}
NOCTIS_CONFIG__INTEGRATIONS__VOICE__URL=ws://livekit:7880
NOCTIS_CONFIG__INTEGRATIONS__VOICE__WEBHOOK_URL=http://noctis_server:8080/api/webhooks/livekit
EOF
  fi

  chmod 600 .env
  chown root:root .env
  log_success ".env file generated"
}

function write_compose_override() {
  log_info "Writing compose.override.yaml..."
  cat > compose.override.yaml <<EOF
# Generated by Noctis install.sh
# Applies local deployment configuration

services:
  valkey:
    restart: unless-stopped
    logging: &default-logging
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

  noctis_server:
    restart: unless-stopped
    env_file:
      - .env
    logging: *default-logging

  meilisearch:
    restart: unless-stopped
    logging: *default-logging

  elasticsearch:
    restart: unless-stopped
    logging: *default-logging

  livekit:
    restart: unless-stopped
    logging: *default-logging
EOF
  log_success "compose.override.yaml generated"
}

function install_dependencies() {
  log_info "Installing dependencies and building application..."

  # Step 1: Configure pnpm trust policy before any install attempt
  # This prevents ERR_PNPM_TRUST_DOWNGRADE on known-safe legacy packages
  log_info "Configuring pnpm trust policy..."

  if ! grep -q "trustPolicyExclude" pnpm-workspace.yaml; then
    log_warn "pnpm trustPolicyExclude not configured — adding safe defaults"
    if grep -q "^trustPolicy:" pnpm-workspace.yaml; then
      # Append trustPolicyExclude after the trustPolicy line
      python3 - << 'PYEOF'
import sys

with open('pnpm-workspace.yaml', 'r') as f:
    content = f.read()

if 'trustPolicyExclude' not in content:
    content = content.replace(
        'trustPolicy: no-downgrade\n',
        'trustPolicy: no-downgrade\ntrustPolicyExclude:\n  - "semver@6.3.1"\n  - "glob@7.2.3"\n  - "inflight@1.0.6"\n  - "rimraf@3.0.2"\n'
    )
    with open('pnpm-workspace.yaml', 'w') as f:
        f.write(content)
    print("Added trustPolicyExclude to pnpm-workspace.yaml")
else:
    print("trustPolicyExclude already configured")
PYEOF
    else
      # No trustPolicy line exists — append the full block
      cat >> pnpm-workspace.yaml << 'EOF'

trustPolicy: no-downgrade
trustPolicyExclude:
  - "semver@6.3.1"
  - "glob@7.2.3"
  - "inflight@1.0.6"
  - "rimraf@3.0.2"
EOF
      log_success "Added pnpm trust policy to pnpm-workspace.yaml"
    fi
  else
    log_success "pnpm trust policy already configured"
  fi

  # Step 2: Attempt install with frozen lockfile first
  # NOTE: Use if/else to capture output+exit — plain VAR=$(cmd) triggers set -e on failure
  log_info "Running pnpm install (frozen lockfile)..."
  if INSTALL_OUTPUT=$(pnpm install --frozen-lockfile 2>&1); then
    log_success "Dependencies installed (frozen lockfile)"
  else
    INSTALL_EXIT=$?
    # Step 3: Frozen failed — classify the error
    log_warn "Frozen lockfile install failed (exit $INSTALL_EXIT). Checking reason..."
    echo "$INSTALL_OUTPUT"

    if echo "$INSTALL_OUTPUT" | grep -q "LOCKFILE_CONFIG_MISMATCH\|lockfile.*mismatch\|catalogs.*configuration"; then
      log_warn "Lockfile is out of sync with workspace config. Regenerating..."
      pnpm install --no-frozen-lockfile 2>&1 \
        || log_error "pnpm install failed even without frozen lockfile. See output above."
      log_success "Lockfile regenerated successfully"

    elif echo "$INSTALL_OUTPUT" | grep -q "TRUST_DOWNGRADE"; then
      # Extract the blocked package name from the error
      BLOCKED_PKG=$(echo "$INSTALL_OUTPUT" | grep -oP 'TRUST_DOWNGRADE.*?"([^"]+)"' | grep -oP '"[^"]+"' | head -1 | tr -d '"')
      log_warn "Trust policy blocked package: $BLOCKED_PKG"
      log_warn "Adding to trustPolicyExclude and retrying..."

      python3 - "$BLOCKED_PKG" << 'PYEOF'
import sys

pkg = sys.argv[1]
with open('pnpm-workspace.yaml', 'r') as f:
    content = f.read()

if pkg and pkg not in content:
    if 'trustPolicyExclude:' in content:
        content = content.replace(
            'trustPolicyExclude:\n',
            f'trustPolicyExclude:\n  - "{pkg}"\n'
        )
    else:
        content += f'\ntrustPolicyExclude:\n  - "{pkg}"\n'
    with open('pnpm-workspace.yaml', 'w') as f:
        f.write(content)
    print(f"Added {pkg} to trustPolicyExclude")
else:
    print(f"Package {pkg} already in trustPolicyExclude or could not be parsed")
PYEOF

      pnpm install --no-frozen-lockfile 2>&1 \
        || log_error "pnpm install failed after trust policy update. See output above."
      log_success "Dependencies installed after trust policy update"

    else
      log_error "pnpm install failed with an unexpected error. See output above."
    fi
  fi

  # Step 4: Typecheck (non-fatal — type errors do not prevent the app from running)
  log_info "Running typecheck (failures are warnings only)..."
  if pnpm --filter @noctis/api run typecheck 2>&1; then
    log_success "Typecheck passed"
  else
    log_warn "Typecheck reported errors — continuing build. Fix types when convenient."
    log_warn "Run 'pnpm --filter @noctis/api run typecheck' to see the full list."
  fi

  # Step 5: Build (fatal — rspack/compile errors must be resolved before the app can start)
  log_info "Building all packages (this may take 5-15 minutes)..."

  # Print a heartbeat every 60s so the terminal doesn't look frozen
  ( while true; do sleep 60; log_info "Build still running..."; done ) &
  BUILD_TIMER_PID=$!

  if pnpm turbo build 2>&1; then
    kill $BUILD_TIMER_PID 2>/dev/null || true
    log_success "Build complete"
  else
    kill $BUILD_TIMER_PID 2>/dev/null || true
    log_error "Build failed (compile/rspack error). Run 'pnpm turbo build' manually to see detailed errors."
  fi
}

function init_database() {
  log_info "Initializing database (Valkey KV + SQLite)..."

  docker compose up -d valkey

  local attempts=0
  until docker compose exec valkey valkey-cli ping >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    [ $attempts -ge 60 ] && log_error "Valkey failed to start after 120 seconds"
    sleep 2
  done

  log_success "Database (Valkey KV) initialized — SQLite managed by noctis_server on first boot"
}

function start_app() {
  log_info "Starting Noctis server..."
  
  PROFILES="--profile search"
  [ "$ENABLE_VOICE" = "yes" ] && PROFILES="$PROFILES --profile voice"
  
  docker compose $PROFILES pull
  docker compose $PROFILES up -d --build
  
  local url="http://localhost:${CONF_PORT}/_health"
  local max_attempts=60
  local attempt=0
  
  log_info "Waiting for Noctis to become healthy..."
  
  while [ $attempt -lt $max_attempts ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      break
    fi
    attempt=$((attempt + 1))
    
    [ $((attempt % 5)) -eq 0 ] && echo -n "."
    sleep 2
  done
  
  if [ $attempt -ge $max_attempts ]; then
    echo ""
    log_error "Noctis did not become healthy after $((max_attempts * 2)) seconds.\nRun 'docker compose logs' to see what went wrong."
  fi
  echo ""
  log_success "Application is running"
}

function create_admin() {
  log_info "Creating admin account..."

  local attempts=0
  local success=false
  while [ $attempts -lt 5 ]; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
      "http://localhost:${CONF_PORT}/api/auth/register" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"${ADMIN_EMAIL}\",
        \"password\": \"${ADMIN_PASSWORD}\",
        \"username\": \"admin\",
        \"global_name\": \"Admin\",
        \"date_of_birth\": \"1990-01-01\",
        \"consent\": true
      }" 2>&1 || echo "curl_failed")

    HTTP_STATUS=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -1)

    if [ "$RESPONSE" = "curl_failed" ]; then
      attempts=$((attempts + 1))
      sleep 3
      continue
    fi

    if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
      log_success "Admin account created via API"
      success=true
      break
    elif echo "$BODY" | grep -qi "already in use\|duplicate\|exists"; then
      log_warn "Admin account already exists — skipping creation"
      success=true
      break
    else
      log_warn "Registration attempt $((attempts+1)) returned HTTP $HTTP_STATUS: $BODY"
      attempts=$((attempts + 1))
      sleep 3
    fi
  done

  if [ "$success" = false ]; then
    log_warn "Could not create admin account via API after 5 attempts."
    log_warn "You can create one manually after installation."
  fi

  # Promote the user to staff via the SQLite database inside the container.
  # The noctis_data named volume holds the DB at /usr/src/app/data/noctis.db.
  # We run sqlite3 inside the noctis_server container to apply the flag.
  log_info "Granting staff role in database (UserFlags.STAFF = bit 0)..."
  if docker compose exec -T noctis_server sh -c \
    "sqlite3 /usr/src/app/data/noctis.db \"UPDATE users SET flags = flags | 1 WHERE email = '${ADMIN_EMAIL}';\"" 2>/dev/null; then
    log_success "Admin staff flag applied"
  else
    log_warn "Could not apply staff flag via sqlite3 inside container (this is non-fatal)."
    log_warn "Use the admin panel or database tools to promote the account manually."
  fi

  unset ADMIN_PASSWORD
  log_success "Admin setup completed"
}

function configure_systemd() {
  log_info "Configuring systemd service..."
  
  PROFILES="--profile search"
  [ "$ENABLE_VOICE" = "yes" ] && PROFILES="$PROFILES --profile voice"
  
  cat > /etc/systemd/system/noctis.service << EOF
[Unit]
Description=Noctis Communication Platform
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker compose ${PROFILES} up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable noctis.service
  systemctl is-enabled noctis.service >/dev/null 2>&1 || log_error "Systemd service failed to enable"
  
  chmod +x scripts/*.sh
  
  log_success "Systemd integration configured"
}

function print_summary() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  🌑 NOCTIS INSTALLATION COMPLETE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  App URL:      http://${CONF_HOST}:${CONF_PORT}"
  echo "  Admin email:  ${ADMIN_EMAIL}"
  echo ""
  echo "  Services running:"
  echo "  ✓ Noctis Server"
  echo "  ✓ Meilisearch (search)"
  [ "$ENABLE_VOICE" = "yes" ] && echo "  ✓ LiveKit (voice/video)"
  echo "  ✓ Database (Valkey + SQLite)"
  echo ""
  echo "  Useful commands:"
  echo "  Start:    sudo bash scripts/start.sh"
  echo "  Stop:     sudo bash scripts/stop.sh"
  echo "  Restart:  sudo bash scripts/restart.sh"
  echo "  Logs:     sudo bash scripts/logs.sh"
  echo "  Update:   sudo bash scripts/update.sh"
  echo "  Backup:   sudo bash scripts/backup.sh"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  IMPORTANT SECURITY NOTES:"
  echo "  • Change your admin password after first login"
  echo "  • Your .env file contains secrets — keep it private"
  echo "  • Set up a domain + HTTPS before going public"
  echo "  • Run: sudo bash scripts/backup.sh regularly"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  Noctis is ready. Open your browser and go to:"
  echo "  → http://${CONF_HOST}:${CONF_PORT}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

function main() {
  pre_flight_checks
  collect_configuration
  install_prerequisites
  configure_firewall
  generate_secrets
  write_env_file
  write_compose_override
  install_dependencies
  init_database
  start_app
  create_admin
  configure_systemd
  print_summary
}

main
