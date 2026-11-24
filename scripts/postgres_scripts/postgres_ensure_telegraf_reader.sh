postgres_ensure_telegraf_reader() {
	if [[ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]]; then
		die "PostgreSQL admin password is not available."
	fi

	local -x PGPASSWORD="$POSTGRES_ADMIN_PASSWORD"
	local -x TELEGRAF_POSTGRES_PASSWORD="${TELEGRAF_POSTGRES_PASSWORD:-}"

	log "Provisioning PostgreSQL Telegraf reader role..."

	if ! docker compose \
		"${POSTGRES_COMPOSE[@]}" \
		exec -T -e PGPASSWORD -e TELEGRAF_POSTGRES_PASSWORD postgres \
		psql -X -v ON_ERROR_STOP=1 \
			-h 127.0.0.1 \
			-U "$POSTGRES_USER" \
			-d "$POSTGRES_DB" \
			>/dev/null <<'SQL'
\getenv telegraf_password TELEGRAF_POSTGRES_PASSWORD
SELECT :'telegraf_password' <> '' AS set_telegraf_password \gset

BEGIN;

SELECT 'CREATE ROLE telegraf_reader LOGIN'
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'telegraf_reader') \gexec

\if :set_telegraf_password
ALTER ROLE telegraf_reader PASSWORD :'telegraf_password';
\endif

CREATE SCHEMA IF NOT EXISTS monitoring;

CREATE OR REPLACE VIEW monitoring.game_counts AS
SELECT
	(SELECT count(*) FROM public.users) AS registered_players,
	(SELECT count(*) FROM public.completedgames) AS gamehistory;

GRANT CONNECT ON DATABASE :"DBNAME" TO telegraf_reader;
GRANT USAGE ON SCHEMA monitoring TO telegraf_reader;
GRANT SELECT ON monitoring.game_counts TO telegraf_reader;

COMMIT;
SQL
	then
		die "Failed to provision PostgreSQL Telegraf reader role."
	fi

	log "PostgreSQL Telegraf reader role provisioned."
}
