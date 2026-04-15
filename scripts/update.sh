#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Updating Noctis..."
git pull origin main
pnpm install --frozen-lockfile
pnpm turbo build
docker compose pull
docker compose --profile search --profile voice up -d --build
echo "Update complete. Noctis is running."
