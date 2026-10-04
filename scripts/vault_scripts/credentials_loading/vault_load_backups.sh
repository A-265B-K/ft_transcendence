vault_load_postgres_backups_password() {
	local vault_root_token

	vault_load_root_token

	log "Loading PostgreSQL backups password from Vault..."

	POSTGRES_BACKUPS_PASSWORD="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault kv get \
				-field=password \
				app/backups
	)" || {
		unset vault_root_token
		die "Failed to retrieve PostgreSQL backups password from Vault."
	}

	unset vault_root_token

	if [[ -z "$POSTGRES_BACKUPS_PASSWORD" ]]; then
		die "PostgreSQL backups password retrieved from Vault is empty."
	fi

	log "PostgreSQL backups password loaded from Vault."
}