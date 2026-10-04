#!/bin/bash
source ./scripts/common.sh
source ./scripts/config.sh

require_docker

mkdir -p "$GRAFANA_SECRETS_DIR"
chmod 700 "$GRAFANA_SECRETS_DIR"

if [[ ! -s "$GRAFANA_VAULT_TOKEN_FILE" ]]; then
    die "Grafana Vault token not found."
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