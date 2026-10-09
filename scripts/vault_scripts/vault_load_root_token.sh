vault_validate_secrets_file() {
	[[ -f "$VAULT_SECRETS_FILE" ]] ||
		die "Vault credentials file '$VAULT_SECRETS_FILE' not found."

	local permissions
	permissions="$(stat -c '%a' "$VAULT_SECRETS_FILE")"

	[[ "$permissions" == "600" ]] ||
		die "$VAULT_SECRETS_FILE must have permissions 600 (currently $permissions)."
}

vault_load_root_token() {
	vault_validate_secrets_file

	vault_root_token="$(
		sed -n 's/^VAULT_ROOT_TOKEN=//p' "$VAULT_SECRETS_FILE"
	)"

	[[ -n "$vault_root_token" ]] ||
		die "VAULT_ROOT_TOKEN is missing from $VAULT_SECRETS_FILE."
}