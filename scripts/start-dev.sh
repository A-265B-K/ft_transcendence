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

# ------------------------------------------------------------
# Pre-Checks
# ------------------------------------------------------------

[[ -f "$COMPOSE_FILE" ]] ||
    die "$COMPOSE_FILE is missing."

command -v docker >/dev/null 2>&1 ||
    die "Docker is not installed."

docker compose version >/dev/null 2>&1 ||
    die "Docker Compose is not available."

log "Loading development configuration..."

source ./scripts/load-env.sh
source ./scripts/grafana-secrets.sh

log "Development configuration loaded."

COMPOSE_FILE="$COMPOSE_FILE" ./scripts/vault-start.sh

log "Starting development stack..."

docker compose \
    -f "$COMPOSE_FILE" \
    up -d

log "Development stack started."