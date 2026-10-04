postgres_ensure_backups_role() {
	if [[ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]]; then
		die "PostgreSQL admin password is not available."
	fi

	if [[ -z "${POSTGRES_BACKUPS_PASSWORD:-}" ]]; then
		die "PostgreSQL backups password is not available."
	fi

	log "Provisioning PostgreSQL backups role..."

	local sql_file

	sql_file="$(mktemp)"
	chmod 600 "$sql_file"
	trap 'rm -f "$sql_file"' RETURN

	cat > "$sql_file" <<SQL
DO \$\$
BEGIN
	IF NOT EXISTS (
		SELECT FROM pg_roles
		WHERE rolname = 'postgres_backups'
	) THEN
		CREATE ROLE postgres_backups LOGIN;
	END IF;
END
\$\$;

ALTER ROLE postgres_backups PASSWORD '$POSTGRES_BACKUPS_PASSWORD';

GRANT CONNECT ON DATABASE "$POSTGRES_DB"
	TO postgres_backups;

GRANT USAGE ON SCHEMA public
	TO postgres_backups;

GRANT SELECT
	ON ALL TABLES IN SCHEMA public
	TO postgres_backups;

GRANT SELECT
	ON ALL SEQUENCES IN SCHEMA public
	TO postgres_backups;
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
		die "Failed to provision PostgreSQL backups role."
	fi

	rm -f "$sql_file"

	log "PostgreSQL backups role provisioned."
}