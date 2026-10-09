vault_unseal() {
	vault_validate_secrets_file

	source "$VAULT_SECRETS_FILE"

	if [[ -z "${VAULT_UNSEAL_KEY_1:-}" ||
		  -z "${VAULT_UNSEAL_KEY_2:-}" ||
		  -z "${VAULT_UNSEAL_KEY_3:-}" ]]; then
		die "Vault unseal keys are missing from $VAULT_SECRETS_FILE."
	fi

	log "Unsealing Vault..."

	for key in \
		"$VAULT_UNSEAL_KEY_1" \
		"$VAULT_UNSEAL_KEY_2" \
		"$VAULT_UNSEAL_KEY_3"
	do
		if ! docker exec "$VAULT_CONTAINER" \
			vault operator unseal "$key" >/dev/null; then
			die "Failed to apply a Vault unseal key."
		fi
	done

	unset VAULT_UNSEAL_KEY_1
	unset VAULT_UNSEAL_KEY_2
	unset VAULT_UNSEAL_KEY_3
	unset VAULT_UNSEAL_KEY_4
	unset VAULT_UNSEAL_KEY_5
	unset VAULT_ROOT_TOKEN

	if vault_is_sealed; then
		die "Vault is still sealed after applying the unseal keys."
	fi

	log "Vault is unsealed."
}