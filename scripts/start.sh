#!/usr/bin/env bash
source ./scripts/common.sh

COMPOSE_FILE="docker-compose.yaml"

[[ -f "$COMPOSE_FILE" ]] ||
    die "$COMPOSE_FILE is missing."

log "Loading application configuration..."

source ./scripts/load-env.sh
source ./scripts/grafana-secrets.sh

log "Application configuration loaded."

COMPOSE_FILE="$COMPOSE_FILE" ./scripts/vault-start.sh

log "Starting application stack..."

docker compose \
    -f "$COMPOSE_FILE" \
    up -d

log "Application stack started."