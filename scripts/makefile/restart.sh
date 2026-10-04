#!/usr/bin/env bash
source ./scripts/common.sh

set -Eeuo pipefail

log "Restarting application stack..."

./scripts/makefile/stop.sh
./scripts/makefile/start.sh

log "Application stack restarted."