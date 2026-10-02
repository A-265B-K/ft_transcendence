#!/usr/bin/env bash

set -Eeuo pipefail

VAULT_CONTAINER="vault"
VAULT_SECRETS_FILE=".vault_secrets"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-dev.yaml}"

log() {
    printf '\n==> %s\n' "$*"
}

die() {
    printf '\nERROR: %s\n' "$*" >&2
    exit 1
}

vault_is_initialized() {
    local status

    status="$(
        docker exec "$VAULT_CONTAINER" \
            vault status -format=json 2>/dev/null || true
    )"

    grep -Eq '"initialized"[[:space:]]*:[[:space:]]*true' <<< "$status"
}

vault_is_sealed() {
    local status

    status="$(
        docker exec "$VAULT_CONTAINER" \
            vault status -format=json 2>/dev/null || true
    )"

    grep -Eq '"sealed"[[:space:]]*:[[:space:]]*true' <<< "$status"
}

log "Starting Vault..."

docker compose \
    -f "$COMPOSE_FILE" \
    up -d vault-init vault

log "Waiting for Vault..."

VAULT_READY="false"

for _ in $(seq 1 30); do
    if docker exec "$VAULT_CONTAINER" \
        wget -q -O /dev/null \
        "http://127.0.0.1:8200/v1/sys/health?sealedcode=200&uninitcode=200" \
        2>/dev/null
    then
        VAULT_READY="true"
        break
    fi

    sleep 1
done

[[ "$VAULT_READY" == "true" ]] ||
    die "Vault did not become available."

log "Checking Vault state..."

if ! vault_is_initialized; then
    die "Vault is not initialized, stopping Vault. Run 'make init' first."
	docker compose -f "$COMPOSE_FILE" stop vault >/dev/null 2>&1 || true
fi

if ! vault_is_sealed; then
    log "Vault is already unsealed."
    log "Vault is ready."
    exit 0
fi

log "Vault is sealed."

[[ -f "$VAULT_SECRETS_FILE" ]] ||
    die "Vault is sealed but $VAULT_SECRETS_FILE is missing."

PERMISSIONS="$(stat -c '%a' "$VAULT_SECRETS_FILE")"

[[ "$PERMISSIONS" == "600" ]] ||
    die "$VAULT_SECRETS_FILE must have permissions 600 (currently $PERMISSIONS)."

source "$VAULT_SECRETS_FILE"

[[ -n "${VAULT_UNSEAL_KEY_1:-}" ]] ||
    die "VAULT_UNSEAL_KEY_1 is missing."

[[ -n "${VAULT_UNSEAL_KEY_2:-}" ]] ||
    die "VAULT_UNSEAL_KEY_2 is missing."

[[ -n "${VAULT_UNSEAL_KEY_3:-}" ]] ||
    die "VAULT_UNSEAL_KEY_3 is missing."

log "Unsealing Vault..."

docker exec "$VAULT_CONTAINER" \
    vault operator unseal "$VAULT_UNSEAL_KEY_1" >/dev/null

docker exec "$VAULT_CONTAINER" \
    vault operator unseal "$VAULT_UNSEAL_KEY_2" >/dev/null

docker exec "$VAULT_CONTAINER" \
    vault operator unseal "$VAULT_UNSEAL_KEY_3" >/dev/null

unset VAULT_UNSEAL_KEY_1
unset VAULT_UNSEAL_KEY_2
unset VAULT_UNSEAL_KEY_3
unset VAULT_UNSEAL_KEY_4
unset VAULT_UNSEAL_KEY_5
unset VAULT_ROOT_TOKEN

if vault_is_sealed; then
    die "Vault is still sealed after applying the unseal keys."
fi

log "Vault is unsealed."
log "Vault is ready."