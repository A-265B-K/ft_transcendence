#!/usr/bin/env bash

set -Eeuo pipefail

COMPOSE_FILE="docker-compose.yaml"

log() {
    printf '\n==> %s\n' "$*"
}

die() {
    printf '\nERROR: %s\n' "$*" >&2
    exit 1
}

log "Loading application configuration..."

[[ -f "$COMPOSE_FILE" ]] ||
    die "$COMPOSE_FILE is missing."

source ./scripts/load-env.sh

log "Application configuration loaded."

docker compose \
	-f "$COMPOSE_FILE" \
	down --volumes

log "Application removed."