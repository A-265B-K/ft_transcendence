vault_load_postgres_admin_password() {
	local vault_root_token

	vault_load_root_token

	log "Loading PostgreSQL admin password from Vault..."

	POSTGRES_ADMIN_PASSWORD="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault kv get \
				-field=password \
				app/postgres
	)" || {
		unset vault_root_token
		die "Failed to retrieve PostgreSQL admin password from Vault."
	}

	unset vault_root_token

	if [[ -z "$POSTGRES_ADMIN_PASSWORD" ]]; then
		die "PostgreSQL admin password retrieved from Vault is empty."
	fi
}