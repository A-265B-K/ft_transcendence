vault_store_email_credentials() {
	local vault_root_token

	if [[ -z "${EMAIL_USER:-}" ]]; then
		die "Email address is not set."
	fi

	if [[ -z "${EMAIL_PASSWORD:-}" ]]; then
		die "Email password is not set."
	fi

	vault_load_root_token

	log "Storing email credentials in Vault..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		-e EMAIL_USER="$EMAIL_USER" \
		-e EMAIL_PASSWORD="$EMAIL_PASSWORD" \
		"$VAULT_CONTAINER" \
		sh -c '
			vault kv put app/email \
				username="$EMAIL_USER" \
				password="$EMAIL_PASSWORD"
		' >/dev/null
	then
		unset vault_root_token
		die "Failed to store email credentials in Vault."
	fi

	unset vault_root_token

	log "Email credentials stored in Vault."
}