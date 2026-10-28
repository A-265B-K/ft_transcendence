grafana_write_secret_files() {
	local grafana_dir="$VAULT_TOKEN_DIR/grafana"
	local grafana_user_file="$grafana_dir/admin_user"
	local grafana_password_file="$grafana_dir/admin_password"

	if [[ -z "${GRAFANA_ADMIN_USER:-}" ]]; then
		die "Grafana admin username is not available."
	fi

	if [[ -z "${GRAFANA_ADMIN_PASSWORD:-}" ]]; then
		die "Grafana admin password is not available."
	fi

	log "Writing Grafana secret files..."

	mkdir -p "$grafana_dir" \
		|| die "Failed to create Grafana secrets directory."

	printf '%s' "$GRAFANA_ADMIN_USER" > "$grafana_user_file" \
		|| die "Failed to write Grafana admin user secret."

	printf '%s' "$GRAFANA_ADMIN_PASSWORD" > "$grafana_password_file" \
		|| die "Failed to write Grafana admin password secret."

	# Grafana runs as UID 472, while these files are created by the
	# host user. Docker Compose file secrets preserve these permissions.
	chmod 644 \
		"$grafana_user_file" \
		"$grafana_password_file" \
		|| die "Failed to set Grafana secret file permissions."

	log "Grafana secret files written."
}