#!/usr/bin/env bash
source ./scripts/common.sh

COMPOSE_FILE="docker-compose-dev.yaml"

[[ -f "$COMPOSE_FILE" ]] ||
    die "$COMPOSE_FILE is missing."

log "Loading development configuration..."

source ./scripts/load-env.sh
source ./scripts/grafana-secrets.sh

log "Development configuration loaded."

# start vault script with COMPOSE_FILE in its env
COMPOSE_FILE="$COMPOSE_FILE" ./scripts/vault-start.sh

log "Starting development stack..."

docker compose \
    -f "$COMPOSE_FILE" \
    up -d \
    --no-recreate

log "Development stack started."