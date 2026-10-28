vault_store_postgres_exporter_credentials() {
	local vault_root_token

	if [[ -z "${POSTGRES_EXPORTER_PASSWORD:-}" ]]; then
		die "PostgreSQL exporter password is not available."
	fi

	vault_load_root_token

	log "Storing PostgreSQL exporter credentials in Vault..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		-e POSTGRES_EXPORTER_USERNAME="postgres_exporter" \
		-e POSTGRES_EXPORTER_PASSWORD="$POSTGRES_EXPORTER_PASSWORD" \
		-e POSTGRES_DATABASE="$POSTGRES_DB" \
		"$VAULT_CONTAINER" \
		sh -c '
			vault kv put app/postgres_exporter \
				username="$POSTGRES_EXPORTER_USERNAME" \
				password="$POSTGRES_EXPORTER_PASSWORD" \
				database="$POSTGRES_DATABASE"
		' >/dev/null
	then
		unset vault_root_token
		die "Failed to store PostgreSQL exporter credentials in Vault."
	fi

	unset vault_root_token

	log "PostgreSQL exporter credentials stored in Vault."
}