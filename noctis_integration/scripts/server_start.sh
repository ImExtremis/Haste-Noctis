#!/usr/bin/env sh

# Copyright (C) 2026 Noctis Contributors
#
# This file is part of Noctis.
#
# Noctis is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Noctis is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with Noctis. If not, see <https://www.gnu.org/licenses/>.

# Start the Noctis server for integration testing
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/noctis_integration/docker/compose.yaml"

echo "Starting Noctis server for integration tests..."

cd "$PROJECT_ROOT"

docker compose -f "$COMPOSE_FILE" up -d noctis_server livekit

echo "Waiting for server to be ready..."
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf -H "X-Forwarded-For: 127.0.0.1" http://localhost:8088/api/v1/_health > /dev/null 2>&1; then
        echo "Server is ready!"
        exit 0
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "Waiting for server... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

echo "Server failed to start within timeout"
docker compose -f "$COMPOSE_FILE" logs noctis_server
exit 1
