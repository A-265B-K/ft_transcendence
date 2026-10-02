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

log "Removing development stack..."

docker compose \
    -f docker-compose-dev.yaml \
    down \
    --volumes \
    --rmi all \
    --remove-orphans

log "Removing production stack..."

docker compose \
    -f docker-compose.yaml \
    down \
    --volumes \
    --rmi all \
    --remove-orphans

log "Removing generated secrets and backups..."

rm -rf \
    .vault_secrets \
    tokens/ \
    backups/backups

log "Full cleanup complete."