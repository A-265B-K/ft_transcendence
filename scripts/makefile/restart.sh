#!/usr/bin/env bash
source ./scripts/common.sh

log "Restarting application stack..."

./scripts/makefile/stop.sh
./scripts/makefile/start.sh

log "Application stack restarted."