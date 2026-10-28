vault_ensure_app_kv() {
	log "Checking Vault app KV engine..."

	local vault_root_token
	local secrets_list

	vault_load_root_token

	vault_root_token="$(
		sed -n 's/^VAULT_ROOT_TOKEN=//p' "$VAULT_SECRETS_FILE"
	)"

	if [[ -z "$vault_root_token" ]]; then
		die "Vault root token is missing from $VAULT_SECRETS_FILE."
	fi

	secrets_list="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault secrets list -format=json
	)" || {
		unset vault_root_token
		die "Failed to inspect Vault secret engines."
	}

	if printf '%s\n' "$secrets_list" | grep -q '"app/"'; then
		unset vault_root_token
		log "Vault app KV engine already exists."
		return 0
	fi

	log "Enabling Vault app KV engine..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		"$VAULT_CONTAINER" \
		vault secrets enable \
			-path=app \
			kv-v2 \
			>/dev/null
	then
		unset vault_root_token
		die "Failed to enable Vault app KV engine."
	fi

	unset vault_root_token

	log "Vault app KV engine enabled."
}