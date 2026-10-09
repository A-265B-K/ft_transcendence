#!/usr/bin/env bash
source ./scripts/config.sh
source ./scripts/common.sh

set -Eeuo pipefail

if [[ ! -f ".bootstrap_complete" ]]; then
	die "Project is not initialized. Run 'make init' first."
fi

require_docker
require_initialized

COMPOSE_FILE_DEV="docker-compose-dev.yaml"

[[ -f "$COMPOSE_FILE_DEV" ]] ||
	die "$COMPOSE_FILE_DEV is missing."

log "Loading development configuration..."

source ./scripts/load-env.sh

log "Development configuration loaded."

# start vault script with COMPOSE_FILE_DEV in its env
COMPOSE_FILE="$COMPOSE_FILE_DEV" ./scripts/vault_scripts/vault-start.sh
./scripts/grafana_scripts/grafana_write_secret_files.sh

log "Starting development stack..."

docker compose \
	-f "$COMPOSE_FILE_DEV" \
	up -d \
	--no-recreate

log "Development stack started."