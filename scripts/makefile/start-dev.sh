#!/usr/bin/env bash
source ./scripts/common.sh

require_docker

COMPOSE_FILE_DEV="docker-compose-dev.yaml"

[[ -f "$COMPOSE_FILE_DEV" ]] ||
    die "$COMPOSE_FILE_DEV is missing."

log "Loading development configuration..."

source ./scripts/load-env.sh
./scripts/grafana_scripts/grafana_write_secret_files.sh

log "Development configuration loaded."

# start vault script with COMPOSE_FILE_DEV in its env
COMPOSE_FILE="$COMPOSE_FILE_DEV" ./scripts/vault_scripts/vault-start.sh

log "Starting development stack..."

docker compose \
    -f "$COMPOSE_FILE_DEV" \
    up -d \
    --no-recreate

log "Development stack started."