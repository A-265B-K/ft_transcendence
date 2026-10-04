vault_ensure_exporter_vault_token() {
	local vault_root_token
	local exporter_vault_token

	vault_load_root_token

	if [[ -s "$POSTGRES_EXPORTER_VAULT_TOKEN_FILE" ]]; then
		chmod 600 "$POSTGRES_EXPORTER_VAULT_TOKEN_FILE"

		if docker exec \
			-e VAULT_TOKEN="$(cat "$POSTGRES_EXPORTER_VAULT_TOKEN_FILE")" \
			"$VAULT_CONTAINER" \
			vault kv get \
				-field=username \
				app/postgres_exporter \
				>/dev/null 2>&1
		then
			unset vault_root_token
			log "Existing postgres exporter Vault token is valid; reusing it."
			return 0
		fi

		log "Existing postgres exporter Vault token is invalid; creating a new one."
	else
		log "Postgres exporter Vault token not found; creating one."
	fi

	log "Ensuring postgres exporter Vault policy..."

	if ! printf '%s\n' \
		'path "app/data/postgres_exporter" {' \
		'  capabilities = ["read"]' \
		'}' |
		docker exec -i \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault policy write \
				"$POSTGRES_EXPORTER_VAULT_POLICY" \
				- \
				>/dev/null
	then
		unset vault_root_token
		die "Failed to create/update postgres exporter Vault policy."
	fi

	log "Creating scoped postgres exporter Vault token..."

	exporter_vault_token="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault token create \
				-policy="$POSTGRES_EXPORTER_VAULT_POLICY" \
				-ttl=8760h \
				-renewable=true \
				-field=token
	)" || {
		unset vault_root_token
		die "Failed to create postgres exporter Vault token."
	}

	if [[ -z "$exporter_vault_token" ]]; then
		unset vault_root_token
		die "Vault returned an empty postgres exporter token."
	fi

	# remove all permissions and write token in token file
	(
		umask 077
		printf '%s\n' "$exporter_vault_token" > "$POSTGRES_EXPORTER_VAULT_TOKEN_FILE"
	)

	chmod 600 "$POSTGRES_EXPORTER_VAULT_TOKEN_FILE"

	unset exporter_vault_token
	unset vault_root_token

	log "Postgres exporter Vault token created and saved to $POSTGRES_EXPORTER_VAULT_TOKEN_FILE."
}
