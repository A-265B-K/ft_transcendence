#!/usr/bin/env bash

set -Eeuo pipefail

log() {
    printf '\n==> %s\n' "$*"
}

die() {
    printf '\nERROR: %s\n' "$*" >&2
    exit 1
}

command -v docker >/dev/null 2>&1 ||
    die "Docker is not installed."

docker compose version >/dev/null 2>&1 ||
    die "Docker Compose is not available."

source ./scripts/load-env.sh

log "Removing application containers and images..."

docker compose \
    -f docker-compose-dev.yaml \
    down --rmi all --remove-orphans

docker compose \
    -f docker-compose.yaml \
    down --rmi all --remove-orphans

log "Application images removed."