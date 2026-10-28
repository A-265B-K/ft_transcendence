vault_initialize() {
	log "Initializing Vault..."

	local init_output
	local root_token
	local unseal_key_1
	local unseal_key_2
	local unseal_key_3
	local unseal_key_4
	local unseal_key_5

	if ! init_output="$(
		docker exec "$VAULT_CONTAINER" \
			vault operator init \
			-key-shares=5 \
			-key-threshold=3
	)"; then
		die "Vault initialization failed."
	fi

	root_token="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Initial Root Token: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_1="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 1: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_2="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 2: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_3="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 3: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_4="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 4: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_5="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 5: \([^[:space:]]*\)$/\1/p'
	)"

	if [[ -z "$root_token" ||
		  -z "$unseal_key_1" ||
		  -z "$unseal_key_2" ||
		  -z "$unseal_key_3" ||
		  -z "$unseal_key_4" ||
		  -z "$unseal_key_5" ]]; then
		die "Failed to extract Vault initialization credentials."
	fi

	if [[ -e "$VAULT_SECRETS_FILE" ]]; then
		die "$VAULT_SECRETS_FILE already exists. Refusing to overwrite it."
	fi

	(
		umask 077

		cat > "$VAULT_SECRETS_FILE" <<EOF
VAULT_ROOT_TOKEN=$root_token
VAULT_UNSEAL_KEY_1=$unseal_key_1
VAULT_UNSEAL_KEY_2=$unseal_key_2
VAULT_UNSEAL_KEY_3=$unseal_key_3
VAULT_UNSEAL_KEY_4=$unseal_key_4
VAULT_UNSEAL_KEY_5=$unseal_key_5
EOF
	)

	chmod 600 "$VAULT_SECRETS_FILE"

	unset init_output
	unset root_token
	unset unseal_key_1
	unset unseal_key_2
	unset unseal_key_3
	unset unseal_key_4
	unset unseal_key_5

	log "Vault initialization credentials saved to $VAULT_SECRETS_FILE."
	sleep 2
}