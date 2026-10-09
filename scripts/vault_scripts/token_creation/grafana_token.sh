vault_ensure_grafana_token() {
	local vault_root_token
	local grafana_token

	vault_load_root_token

	if [[ -s "$GRAFANA_VAULT_TOKEN_FILE" ]]; then
		chmod 600 "$GRAFANA_VAULT_TOKEN_FILE"

		if docker exec \
			-e VAULT_TOKEN="$(cat "$GRAFANA_VAULT_TOKEN_FILE")" \
			"$VAULT_CONTAINER" \
			vault kv get \
				-field=username \
				app/grafana \
				>/dev/null 2>&1
		then
			unset vault_root_token
			log "Existing grafana Vault token is valid; reusing it."
			return 0
		fi

		log "Existing grafana Vault token is invalid; creating a new one."
	else
		log "Grafana Vault token not found; creating one."
	fi

	log "Ensuring grafana Vault policy..."

	if ! printf '%s\n' \
		'path "app/data/grafana" {' \
		'  capabilities = ["read"]' \
		'}' \
		| docker exec -i \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault policy write \
				"$GRAFANA_VAULT_POLICY" \
				- \
				>/dev/null
	then
		unset vault_root_token
		die "Failed to create/update grafana Vault policy."
	fi

	log "Creating scoped grafana Vault token..."

	grafana_token="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault token create \
				-policy="$GRAFANA_VAULT_POLICY" \
				-ttl=8760h \
				-renewable=true \
				-field=token
	)" || {
		unset vault_root_token
		die "Failed to create grafana Vault token."
	}

	if [[ -z "$grafana_token" ]]; then
		unset vault_root_token
		die "Vault returned an empty grafana token."
	fi

	(
		umask 077
		printf '%s\n' "$grafana_token" > "$GRAFANA_VAULT_TOKEN_FILE"
	)

	chmod 600 "$GRAFANA_VAULT_TOKEN_FILE"

	unset grafana_token
	unset vault_root_token

	log "Grafana Vault token created and saved to $GRAFANA_VAULT_TOKEN_FILE."
}