#!/usr/bin/env bash
source ./scripts/common.sh
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