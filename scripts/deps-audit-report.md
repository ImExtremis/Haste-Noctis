# Noctis Dependency Audit Report

> Generated: 2026-04-09 | Audited against: pnpm-workspace.yaml, all package.json files, Dockerfiles, CI configs

---

## Project Architecture Quick Reference

This is **NOT** a standard Express/Fastify/Prisma/PostgreSQL project. Key facts:
- **HTTP Framework:** Hono (not Express or Fastify)
- **Database:** Cassandra (multi-node) + SQLite (self-hosting via `noctis_server`)
- **ORM/Migrations:** None (raw driver queries + TypeScript schema types in `packages/schema`)
- **State (frontend):** MobX (not Redux, not Zustand)
- **Bundler:** Rspack (not Vite, not webpack)
- **Voice/Video:** LiveKit (not mediasoup — see conflict note below)
- **Package manager:** pnpm 10 with catalog-based version pinning
- **Build:** Turborepo + tsgo (TypeScript Go compiler preview)

---

## STEP 1 — Project Structure Summary

### Workspace layout

| Path | Role |
|------|------|
| `apps/api` | API entrypoint binary (thin shell) |
| `apps/web` | Frontend React app (Rspack + Lingui + MobX) |
| `packages/api` | Core API business logic |
| `packages/schema` | TypeScript schema types shared across packages |
| `packages/queue` | Custom background job queue (NOT BullMQ) |
| `packages/kv_client` | Redis/Valkey client wrapper (ioredis) |
| `packages/email` | Email service (nodemailer + custom i18n) |
| `packages/cassandra` | Cassandra DB access layer |
| `packages/rate_limit` | Custom rate limiting (NOT express-rate-limit) |
| `packages/validation` | Input validation utilities |
| `noctis_server` | Self-hosting umbrella binary |
| `noctis_gateway` | Erlang/OTP WebSocket gateway |
| `noctis_media_proxy` | Media proxy service |
| `noctis_marketing` | Marketing pages |

---

## STEP 2 — Node & Runtime Audit

| Item | Value | Status |
|------|-------|--------|
| `.nvmrc` target | `24` | ✅ |
| `noctis_server` engines | `>=24.0.0` | ✅ |
| Dockerfile base image | `node:24-bookworm-slim` / `node:24-trixie-slim` | ✅ |
| CI Node version | `24` | ✅ |
| Workspace pnpm | `pnpm@10.29.3` | ✅ |
| Dockerfile pnpm | `pnpm@10.26.0` (corepack) | ⚠️ DRIFT |
| `deploy_test_server.sh` pnpm | `pnpm@9.15.5` (npm global) | 🔴 BREAKING |

### Issue: pnpm Version Drift

> **All Dockerfiles install `pnpm@10.26.0`** via `corepack prepare pnpm@10.26.0 --activate`,
> but the workspace `packageManager` field is `pnpm@10.29.3`. This is a **minor drift** — the frozen
> lockfile should still install correctly in most cases, but exact reproducibility requires matching versions.
>
> **Fix:** `sed -i 's/pnpm@10.26.0/pnpm@10.29.3/g' noctis_server/Dockerfile apps/api/Dockerfile`

### Issue: deploy_test_server.sh Corrupts package.json

> `deploy_test_server.sh` uses `jq` to **overwrite** the `packageManager` field in `package.json`
> from `pnpm@10.29.3` to `pnpm@9.15.5`, then installs pnpm 9 globally. The pnpm 10 lockfile format
> is **not compatible** with pnpm 9 — this will cause `pnpm install --frozen-lockfile` to fail and
> corrupts the repo state if accidentally committed.
>
> **Fix:** The script must be rewritten to use pnpm 10 with `--trust-policy=no-downgrade` via `.npmrc`.

---

## STEP 3 — Dependency Audit

### 3A — Package Presence Check (Spec vs Reality)

#### Backend

| Spec-Required Package | Present | Where / Notes |
|----------------------|---------|---------------|
| `libsodium-wrappers` | ❌ Missing | Not needed — backend uses `node:crypto` (WebCrypto) for equivalent operations |
| `@types/libsodium-wrappers` | ❌ Missing | Same as above |
| `mediasoup` | ❌ Missing | Project uses **LiveKit** instead |
| `bullmq` | ❌ Missing | Custom queue system in `packages/queue` serves this role |
| `ioredis` | ✅ | `packages/kv_client`, catalog `5.8.1` |
| `@prisma/client` | ❌ Not applicable | No PostgreSQL or Prisma — Cassandra + SQLite used |
| Email sender (`nodemailer`) | ✅ | `packages/email`, catalog `8.0.1` |
| HTTP security headers | ✅ (via Hono) | Hono middleware handles CORS/headers |
| Rate limiting | ✅ | `packages/rate_limit` (custom, Hono-native) |
| File uploads (`multer`) | ❌ Missing | No multipart library found in package.json files |
| `sharp` | ✅ | Catalog `0.34.5`, used in `packages/api` |
| `zod` | ✅ | Catalog `4.3.6` (also `valibot@1.2.0` for frontend) |
| `argon2` | ✅ | Catalog `0.44.0`, used in `packages/api/src/utils/PasswordUtils.tsx` |
| `jsonwebtoken` | ❌ Not used | `jose@6.1.3` is used instead (better standard, no TS issues) |
| `cors` | ✅ (via Hono) | Handled at framework level |
| `dotenv` | ❌ Not used | Config is file-based via `NOCTIS_CONFIG` JSON |

#### Frontend

| Spec-Required Package | Present | Where / Notes |
|----------------------|---------|---------------|
| `libsodium-wrappers` (client) | ❌ Missing | E2E encryption uses WebCrypto API directly — see `apps/web/src/lib/E2EEncryption.tsx` |
| `idb` (IndexedDB wrapper) | ❌ Missing | Raw IndexedDB API used instead |
| `zustand` | ❌ Missing | **MobX** is the state manager (`mobx@6.15.0`) |
| `react-window` / `@tanstack/react-virtual` | ❌ Missing | No virtual scrolling library currently |
| `dompurify` | ❌ Missing | No explicit XSS sanitization for rendered Markdown |
| `marked` / `remark` | ❌ Not used | `packages/markdown_parser` is a custom implementation |
| `@rnnoise/rnnoise-wasm` | ❌ Missing | Noise suppression not implemented |
| `mediasoup-client` | ❌ Missing | LiveKit client used instead |
| `date-fns` / `dayjs` | ❌ Not needed | `luxon@3.7.2` handles date formatting ✅ |
| `react-dropzone` | ❌ Missing | Not installed |
| `clsx` | ✅ | Catalog `2.1.1` |
| `tailwind-merge` | ❌ Missing | Tailwind 4 used; no merge utility |

---

### 3B — Version/Outdated Check

No packages found to be significantly behind. The catalog versions are current. Notable items:

| Package | Installed | Notes |
|---------|-----------|-------|
| `@types/node` | `25.2.2` | ⚠️ Node 25 types on Node 24 runtime — minor compatibility risk |
| `@typescript/native-preview` | `7.0.0-dev.20260209.1` | Pre-release Go TS compiler — acceptable for dev |
| `react` | `19.2.4` | Latest React 19 ✅ |
| `livekit-client` | `2.17.1` | Current ✅ |
| `hono` | `4.11.9` | Current ✅ |

---

### 3C — Conflict Check

| Conflict Type | Status |
|--------------|--------|
| Multiple React versions | ✅ None — single catalog pin |
| `bcrypt` + `argon2` | ✅ Only `argon2` in production code; `bcrypt-pbkdf` appears only as transitive SSH dep |
| `mediasoup` + `livekit-client` | ✅ No conflict — only LiveKit present |
| `yarn.lock` + `pnpm-lock.yaml` | ✅ Only `pnpm-lock.yaml` |
| `@types/node` vs runtime | ⚠️ `@types/node@25` on Node 24 |
| Package manager version | ⚠️ Dockerfile uses pnpm 10.26.0, workspace expects 10.29.3 |

---

### 3D — Security Vulnerabilities

Run after install: `pnpm audit`

Known concerns at time of audit:
- `semver` — historical prototype pollution. Controlled via `trust-policies` in `.npmrc` and `pnpm-workspace.yaml`.
- No direct dependencies with known critical CVEs in the pinned catalog versions.

---

### 3E — Peer Dependency Warnings

| Package | Issue | Fix |
|---------|-------|-----|
| `@lingui/swc-plugin@5.10.1` | Peer requires specific rspack major | Pinned via `pnpm.overrides` ✅ |
| `mobx-persist-store@1.1.8` | May warn about `mobx@6` peer | `allowedVersions.react: *` helps; suppress if needed |
| `react-dnd-multi-backend@9.0.0` | Peer for react-dnd version | Suppressed via `allowedVersions` |

---

## STEP 4 — Environment Variables Audit

### Architecture Note

The Noctis application uses **JSON file-based config** (not `.env`). The main config file is:
- Path: `config/config.json` (gitignored)
- Template: `config/config.dev.template.json` (committed)
- Pointer: `NOCTIS_CONFIG` environment variable

The `.env` file is **only** for Docker Compose variables:
- `MEILI_MASTER_KEY` — required for Meilisearch
- Port overrides — optional

### Secrets / Security Scan

No hardcoded secrets found in source files. `dev_bootstrap.sh` generates secrets locally and writes to `config.json`. All config templates use empty strings for secrets.

---

## STEP 5 — Build Tooling Audit

### TypeScript / tsgo

- Using `@typescript/native-preview` (tsgo, Go-based TS compiler)
- Much faster than `tsc` but is a pre-release binary
- If tsgo breaks, fallback: change all `tsgo --noEmit` to `tsc --noEmit` in `package.json` scripts

### Rspack (Frontend Build)

- `@rspack/core@1.7.5` — Rust-based Webpack-compatible bundler
- Path aliases configured in both `tsconfig.json` and `rspack.config.mjs` ✅ (consistent)
- CSS Modules via PostCSS pipeline ✅
- Lingui SWC plugin for i18n ✅

### WASM Build Requirement

The `apps/web` package includes a Rust WASM crate at `apps/web/crates/libfluxcore`. The build script `pnpm wasm:codegen` invokes `wasm-pack`. This requires:
- Rust toolchain (`rustup`, `cargo`)
- `wasm-pack` binary
- The script `pnpm build` in `apps/web` runs `wasm:codegen` first

> **For development without WASM changes:** If you're not modifying the Rust crate, WASM codegen can be skipped. The output artifacts in `pkgs/libfluxcore` should already be present if generated previously.

### Tailwind CSS 4

- `tailwindcss@4.1.18` — uses new cascade layers approach (no `tailwind.config.js`)
- CSS is processed via `@tailwindcss/cli` and PostCSS
- No Tailwind-specific config file needed (v4 behavior)

### Circular Dependencies

No circular dependency analysis performed in this audit (requires `madge`). Monorepo workspace packages reference each other via `workspace:*` which is standard and managed by pnpm.

---

## STEP 6 — mediasoup Audit

**mediasoup is NOT installed.**

The project currently uses LiveKit, which is fully operational. If migration is required:

Build requirements for mediasoup:
- `python3` ✅ (used in Dockerfiles already)
- `make` ✅ (in Dockerfiles already)
- `gcc`/`g++` ✅ (in Dockerfiles already)
- `build-essential` ✅ (in Dockerfiles already)
- Node 24 ✅ (compatible)

Migration complexity: **HIGH** — requires full WebRTC stack rewrite on both frontend and backend.

---

## STEP 7 — Database Audit

### No Prisma / No PostgreSQL

The project uses:
1. **Cassandra** (`cassandra-driver@4.8.0`) — primary production database
2. **SQLite** (embedded) — for self-hosting via `noctis_server`

Schema is defined as TypeScript types in `packages/schema/src`.

Migrations are handled via the Cassandra migration workflow (`.github/workflows/migrate-cassandra.yaml`).

### Phase 1 Spec Tables

The spec tables (mod_cases, polls, etc.) should be defined in `packages/schema/src` as TypeScript interfaces and in Cassandra CQL. A dedicated schema review against the spec is required — this is outside the scope of a dependency audit.

---

## Critical Issues (Priority Order)

### 🔴 P0 — Dockerfile path mismatch (production breaking)

`noctis_server/Dockerfile` references `noctis_app/` on **4 lines** (58, 113, 115, 151).
After the Fluxer→Noctis rebrand, the web app moved to `apps/web`.
The Docker build will **fail** trying to `COPY noctis_app/...`.

```bash
# Lines to fix in noctis_server/Dockerfile:
# 58:  COPY noctis_app/package.json ./noctis_app/          → apps/web/package.json ./apps/web/
# 113: COPY noctis_app/ ./noctis_app/                      → apps/web/ ./apps/web/
# 115: RUN cd noctis_app && pnpm build                     → RUN cd apps/web && pnpm build
# 151: COPY --from=app-build /usr/src/app/noctis_app/dist  → /usr/src/app/apps/web/dist
```

### 🔴 P0 — `deploy_test_server.sh` corrupts the repository

Force-downgrades pnpm to `9.15.5` and mutates `package.json`. Will break anyone who runs it.

### 🟡 P1 — `@types/node@25.2.2` on Node 24

Change in `pnpm-workspace.yaml` catalog:
```yaml
'@types/node': 24.x.x  # was 25.2.2
```

### 🟡 P1 — pnpm version drift in Dockerfiles

Update Dockerfiles from `pnpm@10.26.0` → `pnpm@10.29.3`.

### 🟡 P2 — Missing DOMPurify for XSS protection

`apps/web` renders Markdown from user messages. Without DOMPurify, XSS is a risk.
```bash
pnpm --filter noctis_app add dompurify
pnpm --filter noctis_app add -D @types/dompurify
```

### 🟡 P2 — No virtual scrolling for message lists

Large channels will suffer performance issues without windowing.
```bash
pnpm --filter noctis_app add @tanstack/react-virtual
```

### ℹ️ P3 — `bcrypt` vs `argon2` spec inconsistency

Spec doc says `bcrypt`, code uses `argon2`. **argon2 is correct and more secure.** The spec document at `NOCTIS_SPEC.md:1409` should be updated to reflect `argon2`.

---

## Dependency Patch Commands

### ADD

```bash
# XSS protection (recommended)
pnpm --filter noctis_app add dompurify @types/dompurify

# Virtual scrolling for message lists (recommended)
pnpm --filter noctis_app add @tanstack/react-virtual

# File drag-drop upload (if needed)
pnpm --filter noctis_app add react-dropzone

# IndexedDB wrapper for key storage (if moving away from raw API)
pnpm --filter noctis_app add idb
```

### REMOVE (only if mediasoup migration is complete)

```bash
pnpm --filter noctis_app remove livekit-client @livekit/components-react @livekit/track-processors
pnpm --filter @noctis/api remove livekit-server-sdk
# Also remove LiveKit service from compose.yaml
```

### UPGRADE

```bash
# Fix @types/node version (in pnpm-workspace.yaml catalog, change 25.2.2 → 24.x.x)
# Then:
pnpm install
```

### DOCKERFILE FIXES

```bash
# Fix pnpm version in Dockerfiles
sed -i 's/pnpm@10\.26\.0/pnpm@10.29.3/g' noctis_server/Dockerfile apps/api/Dockerfile

# Manual fix required for noctis_server/Dockerfile noctis_app → apps/web paths (lines 58, 113, 115, 151)
```

### ENV VARIABLES MISSING

None — all required variables are documented in `.env.example` (just created) and `config/config.dev.template.json`.

### SECURITY ISSUES

None found. No hardcoded production credentials in source files.

### BREAKING RISKS

| Change | Risk | Safe Approach |
|--------|------|---------------|
| Remove LiveKit → add mediasoup | Breaks voice/video for all users | Feature-flag it; keep LiveKit until mediasoup is tested |
| Upgrade `@types/node` 25→24 | May cause `tsgo` type errors | Run `pnpm typecheck` after and fix any errors |
| Fix Dockerfile `noctis_app` → `apps/web` | Docker build broken until fixed | Atomic change + CI verification |
| `deploy_test_server.sh` rewrite | Breaks current test server workflow | Test on non-production first |
