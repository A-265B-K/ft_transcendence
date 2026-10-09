#!/usr/bin/env bash
source ./scripts/common.sh
source ./scripts/load-env.sh

set -Eeuo pipefail

require_docker

log "Stopping development stack..."

docker compose \
	-f docker-compose-dev.yaml \
	down --remove-orphans

log "Stopping production stack..."

docker compose \
	-f docker-compose.yaml \
	down --remove-orphans

log "Application stopped."