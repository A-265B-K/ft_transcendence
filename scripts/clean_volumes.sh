#!/usr/bin/env bash
source ./scripts/common.sh
source ./scripts/load-env.sh

log "Removing application volumes..."

docker compose \
    -f docker-compose-dev.yaml \
    down --volumes --remove-orphans

docker compose \
    -f docker-compose.yaml \
    down --volumes --remove-orphans

log "Application volumes removed."