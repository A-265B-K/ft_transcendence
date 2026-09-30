#!/usr/bin/env bash

set -Eeuo pipefail

COMPOSE_FILE="docker-compose-dev.yaml"

log() {
    printf '\n==> %s\n' "$*"
}

die() {
    printf '\nERROR: %s\n' "$*" >&2
    exit 1
}

[[ -f "$COMPOSE_FILE" ]] ||
    die "$COMPOSE_FILE is missing."

command -v docker >/dev/null 2>&1 ||
    die "Docker is not installed."

docker compose version >/dev/null 2>&1 ||
    die "Docker Compose is not available."

source ./scripts/load-env.sh

log "Stopping development stack..."

docker compose \
    -f "$COMPOSE_FILE" \
    down

log "Development stack stopped."