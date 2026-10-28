vault_is_initialized() {
	local status_output
	status_output=""

	status_output="$(
		docker exec "$VAULT_CONTAINER" \
			vault status -format=json 2>/dev/null || true
	)"

	[[ "$status_output" == *'"initialized": true'* ]]
}

vault_is_sealed() {
	local status_output
	status_output=""

	status_output="$(
		docker exec "$VAULT_CONTAINER" \
			vault status -format=json 2>/dev/null || true
	)"

	[[ "$status_output" == *'"sealed": true'* ]]
}