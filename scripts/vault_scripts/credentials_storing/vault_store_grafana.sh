vault_store_grafana_credentials() {
	local vault_root_token

	if [[ -z "${GRAFANA_ADMIN_USER:-}" ]]; then
		die "Grafana admin username is not set."
	fi

	if [[ -z "${GRAFANA_ADMIN_PASSWORD:-}" ]]; then
		die "Grafana admin password is not set."
	fi

	vault_load_root_token

	log "Storing Grafana credentials in Vault..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		-e GRAFANA_ADMIN_USER="$GRAFANA_ADMIN_USER" \
		-e GRAFANA_ADMIN_PASSWORD="$GRAFANA_ADMIN_PASSWORD" \
		"$VAULT_CONTAINER" \
		sh -c '
			vault kv put app/grafana \
				username="$GRAFANA_ADMIN_USER" \
				password="$GRAFANA_ADMIN_PASSWORD"
		' >/dev/null
	then
		unset vault_root_token
		die "Failed to store Grafana credentials in Vault."
	fi

	unset vault_root_token

	log "Grafana credentials stored in Vault."
}