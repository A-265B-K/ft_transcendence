#!/usr/bin/env bash
source ./scripts/common.sh
source ./scripts/load-env.sh

set -Eeuo pipefail

require_docker

log "Removing application volumes..."

docker compose \
	-f docker-compose-dev.yaml \
	down --volumes --remove-orphans

docker compose \
	-f docker-compose.yaml \
	down --volumes --remove-orphans

POSTGRES_VOLUME="${POSTGRES_VOLUME_NAME:-ft_transcendence_postgres_data}"

if docker volume inspect "$POSTGRES_VOLUME" >/dev/null 2>&1; then
    log "Removing PostgreSQL volume: $POSTGRES_VOLUME"

    docker volume rm "$POSTGRES_VOLUME" ||
        die "Failed to remove PostgreSQL volume: $POSTGRES_VOLUME"
fi

log "Application volumes removed."