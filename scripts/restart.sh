#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose down
docker compose --profile search --profile voice up -d
echo "Noctis restarted"
