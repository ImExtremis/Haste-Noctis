#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker compose down
echo "Noctis stopped"
