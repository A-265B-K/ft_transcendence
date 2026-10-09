vault_store_postgres_app_credentials() {
	local vault_root_token

	if [[ -z "${POSTGRES_APP_PASSWORD:-}" ]]; then
		die "PostgreSQL application password is not available."
	fi

	vault_load_root_token

	log "Storing PostgreSQL application credentials in Vault..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		-e POSTGRES_APP_USERNAME="transcendence_app" \
		-e POSTGRES_APP_PASSWORD="$POSTGRES_APP_PASSWORD" \
		-e POSTGRES_DATABASE="$POSTGRES_DB" \
		"$VAULT_CONTAINER" \
		sh -c '
			vault kv put app/postgres-app \
				username="$POSTGRES_APP_USERNAME" \
				password="$POSTGRES_APP_PASSWORD" \
				database="$POSTGRES_DATABASE"
		' >/dev/null
	then
		unset vault_root_token
		die "Failed to store PostgreSQL application credentials in Vault."
	fi

	unset vault_root_token

	log "PostgreSQL application credentials stored in Vault."
}