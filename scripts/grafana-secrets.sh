#!/bin/bash

set -euo pipefail

VAULT_CONTAINER="vault"
VAULT_TOKEN_DIR="tokens"

GRAFANA_VAULT_TOKEN_FILE="$VAULT_TOKEN_DIR/.grafana_vault_token"
GRAFANA_SECRETS_DIR="$VAULT_TOKEN_DIR/grafana"

mkdir -p "$GRAFANA_SECRETS_DIR"
chmod 700 "$GRAFANA_SECRETS_DIR"

if [[ ! -s "$GRAFANA_VAULT_TOKEN_FILE" ]]; then
    echo "Grafana Vault token not found." >&2
    exit 1
fi

grafana_token="$(cat "$GRAFANA_VAULT_TOKEN_FILE")"

grafana_username="$(
    docker exec \
        -e VAULT_TOKEN="$grafana_token" \
        "$VAULT_CONTAINER" \
        vault kv get \
            -field=username \
            app/grafana
)"

grafana_password="$(
    docker exec \
        -e VAULT_TOKEN="$grafana_token" \
        "$VAULT_CONTAINER" \
        vault kv get \
            -field=password \
            app/grafana
)"

(
    umask 077
    printf '%s' "$grafana_username" \
        > "$GRAFANA_SECRETS_DIR/admin_user"

    printf '%s' "$grafana_password" \
        > "$GRAFANA_SECRETS_DIR/admin_password"
)

unset grafana_token
unset grafana_username
unset grafana_password