#!/usr/bin/env bash
source ./scripts/common.sh
source ./scripts/load-env.sh

set -Eeuo pipefail

require_docker

log "Removing application containers and images..."

docker compose \
	-f docker-compose-dev.yaml \
	down --rmi all --remove-orphans

docker compose \
	-f docker-compose.yaml \
	down --rmi all --remove-orphans

log "Application images removed."