vault_load_postgres_exporter_password() {
	local vault_root_token

	vault_load_root_token
	
	log "Loading PostgreSQL exporter password from Vault..."

	POSTGRES_EXPORTER_PASSWORD="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault kv get \
				-field=password \
				app/postgres_exporter
	)" || {
		unset vault_root_token
		die "Failed to retrieve PostgreSQL exporter password from Vault."
	}

	unset vault_root_token

	if [[ -z "$POSTGRES_EXPORTER_PASSWORD" ]]; then
		die "PostgreSQL exporter password retrieved from Vault is empty."
	fi

	log "PostgreSQL exporter password loaded from Vault."
}