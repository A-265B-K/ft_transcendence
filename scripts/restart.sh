#!/usr/bin/env bash

set -Eeuo pipefail

log() {
    printf '\n==> %s\n' "$*"
}

log "Restarting application stack..."

./scripts/stop.sh
./scripts/start.sh

log "Application stack restarted."