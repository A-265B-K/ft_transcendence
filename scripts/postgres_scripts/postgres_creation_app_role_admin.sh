postgres_ensure_app_role() {
	if [[ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]]; then
		die "PostgreSQL admin password is not available."
	fi

	if [[ -z "${POSTGRES_APP_PASSWORD:-}" ]]; then
		die "PostgreSQL application password is not available."
	fi

	log "Provisioning PostgreSQL application role..."

	local sql_file

	sql_file="$(mktemp)"
	chmod 600 "$sql_file"
	# make sure the temporary sql_file file gets deleted even on return
	trap 'rm -f "$sql_file"' RETURN

	cat > "$sql_file" <<SQL
DO \$\$
BEGIN
	IF NOT EXISTS (
		SELECT FROM pg_roles
		WHERE rolname = 'transcendence_app'
	) THEN
		CREATE ROLE transcendence_app LOGIN;
	END IF;
END
\$\$;

ALTER ROLE transcendence_app PASSWORD '$POSTGRES_APP_PASSWORD';

GRANT CONNECT ON DATABASE "$POSTGRES_DB"
	TO transcendence_app;

GRANT USAGE ON SCHEMA public
	TO transcendence_app;

GRANT SELECT, INSERT, UPDATE, DELETE
	ON ALL TABLES IN SCHEMA public
	TO transcendence_app;

GRANT USAGE, SELECT, UPDATE
	ON ALL SEQUENCES IN SCHEMA public
	TO transcendence_app;
SQL

	if ! docker compose \
		"${POSTGRES_COMPOSE[@]}" \
		exec -T postgres \
		env PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" \
		psql \
			-h 127.0.0.1 \
			-U "$POSTGRES_USER" \
			-d "$POSTGRES_DB" \
			< "$sql_file" \
			>/dev/null
	then
		rm -f "$sql_file"
		die "Failed to provision PostgreSQL application role."
	fi

	rm -f "$sql_file"

	log "PostgreSQL application role provisioned."
}