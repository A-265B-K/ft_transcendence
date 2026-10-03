#!/usr/bin/env bash
source ./scripts/common.sh

log "Restarting application stack..."

./scripts/stop.sh
./scripts/start.sh

log "Application stack restarted."