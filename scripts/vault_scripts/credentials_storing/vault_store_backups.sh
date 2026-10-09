vault_store_postgres_backups_credentials() {
	local vault_root_token

	if [[ -z "${POSTGRES_BACKUPS_PASSWORD:-}" ]]; then
		die "PostgreSQL backups password is not available."
	fi

	vault_load_root_token

	log "Storing PostgreSQL backups credentials in Vault..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		-e POSTGRES_BACKUPS_USERNAME="postgres_backups" \
		-e POSTGRES_BACKUPS_PASSWORD="$POSTGRES_BACKUPS_PASSWORD" \
		-e POSTGRES_DATABASE="$POSTGRES_DB" \
		"$VAULT_CONTAINER" \
		sh -c '
			vault kv put app/backups \
				username="$POSTGRES_BACKUPS_USERNAME" \
				password="$POSTGRES_BACKUPS_PASSWORD" \
				database="$POSTGRES_DATABASE"
		' >/dev/null
	then
		unset vault_root_token
		die "Failed to store PostgreSQL backups credentials in Vault."
	fi

	unset vault_root_token

	log "PostgreSQL backups credentials stored in Vault."
}