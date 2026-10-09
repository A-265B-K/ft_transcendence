postgres_ensure_exporter_role() {
	if [[ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]]; then
		die "PostgreSQL admin password is not available."
	fi

	if [[ -z "${POSTGRES_EXPORTER_PASSWORD:-}" ]]; then
		die "PostgreSQL exporter password is not available."
	fi

	log "Provisioning PostgreSQL exporter role..."

	local sql_file

	sql_file="$(mktemp)"
	chmod 600 "$sql_file"
	trap 'rm -f "$sql_file"' RETURN

	cat > "$sql_file" <<SQL
DO \$\$
BEGIN
	IF NOT EXISTS (
		SELECT FROM pg_roles
		WHERE rolname = 'postgres_exporter'
	) THEN
		CREATE ROLE postgres_exporter LOGIN;
	END IF;
END
\$\$;

ALTER ROLE postgres_exporter PASSWORD '$POSTGRES_EXPORTER_PASSWORD';

GRANT CONNECT ON DATABASE "$POSTGRES_DB"
	TO postgres_exporter;

GRANT USAGE ON SCHEMA public
	TO postgres_exporter;

GRANT pg_monitor
	TO postgres_exporter;

GRANT SELECT ON TABLE users
	TO postgres_exporter;
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
		die "Failed to provision PostgreSQL exporter role."
	fi

	rm -f "$sql_file"

	log "PostgreSQL exporter role provisioned."
}