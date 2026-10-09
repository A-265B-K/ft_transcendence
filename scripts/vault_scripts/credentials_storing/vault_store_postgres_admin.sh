vault_store_postgres_credentials() {
	local vault_root_token

	if [[ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]]; then
		die "PostgreSQL password is not available."
	fi

	vault_load_root_token

	log "Storing PostgreSQL credentials in Vault..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		-e POSTGRES_USERNAME="$POSTGRES_USER" \
		-e POSTGRES_PASSWORD="$POSTGRES_ADMIN_PASSWORD" \
		-e POSTGRES_DATABASE="$POSTGRES_DB" \
		"$VAULT_CONTAINER" \
		sh -c '
			vault kv put app/postgres \
				username="$POSTGRES_USERNAME" \
				password="$POSTGRES_PASSWORD" \
				database="$POSTGRES_DATABASE"
		' >/dev/null
	then
		unset vault_root_token
		die "Failed to store PostgreSQL credentials in Vault."
	fi

	unset vault_root_token

	log "PostgreSQL credentials stored in Vault."
}