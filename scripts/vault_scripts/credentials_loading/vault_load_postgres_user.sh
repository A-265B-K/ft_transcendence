vault_load_postgres_app_password() {
	local vault_root_token

	vault_load_root_token

	log "Loading PostgreSQL application password from Vault..."

	POSTGRES_APP_PASSWORD="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault kv get \
				-field=password \
				app/postgres-app
	)" || {
		unset vault_root_token
		die "Failed to retrieve PostgreSQL application password from Vault."
	}

	unset vault_root_token

	if [[ -z "$POSTGRES_APP_PASSWORD" ]]; then
		die "PostgreSQL application password retrieved from Vault is empty."
	fi
}