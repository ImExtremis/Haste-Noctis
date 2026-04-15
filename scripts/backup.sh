#!/bin/bash
set -euo pipefail

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Backing up Noctis data to $BACKUP_DIR..."

cd "$(dirname "$0")/.."

if [ -f .env ]; then
	cp .env "$BACKUP_DIR/env.backup"
	chmod 600 "$BACKUP_DIR/env.backup"
fi

if [ -f config/config.json ]; then
	cp config/config.json "$BACKUP_DIR/config.json.backup"
fi

# Volumes from compose.yaml
VOLUMES=("valkey_data" "noctis_data" "meilisearch_data" "elasticsearch_data")

for VOL in "${VOLUMES[@]}"; do
	echo "Backing up volume: $VOL"
	docker run --rm -v "noctis_${VOL}:/data" -v "$(pwd)/$BACKUP_DIR:/backup" alpine tar czf "/backup/${VOL}.tar.gz" /data || echo "Warning: Could not backup $VOL"
done

echo "Backup complete: $BACKUP_DIR"
echo "Keep this directory secure — it contains your .env file and all data."
