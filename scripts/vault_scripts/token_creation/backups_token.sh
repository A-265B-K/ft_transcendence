vault_ensure_backups_token() {
	local vault_root_token
	local backups_token

	vault_load_root_token

	if [[ -s "$BACKUPS_VAULT_TOKEN_FILE" ]]; then
		chmod 600 "$BACKUPS_VAULT_TOKEN_FILE"

		if docker exec \
			-e VAULT_TOKEN="$(cat "$BACKUPS_VAULT_TOKEN_FILE")" \
			"$VAULT_CONTAINER" \
			vault kv get \
				-field=username \
				app/backups \
				>/dev/null 2>&1
		then
			unset vault_root_token
			log "Existing backups Vault token is valid; reusing it."
			return 0
		fi

		log "Existing backups Vault token is invalid; creating a new one."
	else
		log "Postgres backups Vault token not found; creating one."
	fi

	log "Ensuring backups Vault policy..."

	if ! printf '%s\n' \
		'path "app/data/backups" {' \
'  capabilities = ["read"]' \
'}' |
		docker exec -i \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault policy write \
				"$BACKUPS_VAULT_POLICY" \
				- \
				>/dev/null
	then
		unset vault_root_token
		die "Failed to create/update backups Vault policy."
	fi

	log "Creating scoped backups Vault token..."

	backups_token="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault token create \
				-policy="$BACKUPS_VAULT_POLICY" \
				-ttl=8760h \
				-renewable=true \
				-field=token
	)" || {
		unset vault_root_token
		die "Failed to create backups Vault token."
	}

	if [[ -z "$backups_token" ]]; then
		unset vault_root_token
		die "Vault returned an empty backups token."
	fi

	# remove all permissions and write token in token file
	(
		umask 077
		printf '%s\n' "$backups_token" > "$BACKUPS_VAULT_TOKEN_FILE"
	)

	chmod 600 "$BACKUPS_VAULT_TOKEN_FILE"

	unset backups_token
	unset vault_root_token

	log "Backups Vault token created and saved to $BACKUPS_VAULT_TOKEN_FILE."
}
