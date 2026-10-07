#!/usr/bin/env bash
source ./scripts/common.sh

set -Eeuo pipefail

if [[ ! -f ".bootstrap_complete" ]]; then
	die "Project is not initialized. Run 'make init' first."
fi

require_docker
require_initialized

COMPOSE_FILE_PROD="docker-compose.yaml"

[[ -f "$COMPOSE_FILE_PROD" ]] ||
	die "$COMPOSE_FILE_PROD is missing."

log "Loading application configuration..."

source ./scripts/load-env.sh

log "Application configuration loaded."

COMPOSE_FILE="$COMPOSE_FILE_PROD" ./scripts/vault_scripts/vault-start.sh
./scripts/grafana_scripts/grafana_write_secret_files.sh

log "Starting application stack..."

docker compose \
	-f "$COMPOSE_FILE_PROD" \
	up -d

log "Application stack started."