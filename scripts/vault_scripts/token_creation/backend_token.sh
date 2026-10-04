vault_ensure_backend_token() {
	local vault_root_token
	local backend_token

	vault_load_root_token

	# Reuse the existing backend token if it is still valid
	# and can read the backend's allowed secret.
	if [[ -s "$BACKEND_VAULT_TOKEN_FILE" ]]; then
		chmod 600 "$BACKEND_VAULT_TOKEN_FILE"

		if docker exec \
			-e VAULT_TOKEN="$(cat "$BACKEND_VAULT_TOKEN_FILE")" \
			"$VAULT_CONTAINER" \
			vault kv get \
				-field=username \
				app/postgres-app \
				>/dev/null 2>&1
		then
			unset vault_root_token
			log "Existing backend Vault token is valid; reusing it."
			return 0
		fi

		log "Existing backend Vault token is invalid; creating a new one."
	else
		log "Backend Vault token not found; creating one."
	fi

	# Ensure the backend policy exists and has only the required read access.
	log "Ensuring backend Vault policy..."

	if ! printf '%s\n' \
		'path "app/data/postgres-app" {' \
		'  capabilities = ["read"]' \
		'}' \
		'path "app/data/email" {' \
		'  capabilities = ["read"]' \
		'}' |
		docker exec -i \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault policy write \
				"$BACKEND_VAULT_POLICY" \
				- \
				>/dev/null
	then
		unset vault_root_token
		die "Failed to create/update backend Vault policy."
	fi

	log "Creating scoped backend Vault token..."

	# backend vault token creation with 1 year validation time
	backend_token="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault token create \
				-policy="$BACKEND_VAULT_POLICY" \
				-ttl=8760h \
				-renewable=true \
				-field=token
	)" || {
		unset vault_root_token
		die "Failed to create backend Vault token."
	}

	if [[ -z "$backend_token" ]]; then
		unset vault_root_token
		die "Vault returned an empty backend token."
	fi

	# remove all permissions and write token in token file
	(
		umask 077
		printf '%s\n' "$backend_token" > "$BACKEND_VAULT_TOKEN_FILE"
	)

	chmod 600 "$BACKEND_VAULT_TOKEN_FILE"

	unset backend_token
	unset vault_root_token

	log "Backend Vault token created and saved to $BACKEND_VAULT_TOKEN_FILE."
}