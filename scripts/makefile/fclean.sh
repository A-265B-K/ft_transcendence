#!/usr/bin/env bash
source ./scripts/config.sh
source ./scripts/common.sh
source ./scripts/load-env.sh

set -Eeuo pipefail

require_docker

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
	backups/backups \
	.bootstrap_complete

log "Full cleanup complete."