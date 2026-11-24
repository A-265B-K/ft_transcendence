#!/usr/bin/env bash

SECRET_FILE="${SECRET_FILE:-.secret}"

if [[ ! -f "$SECRET_FILE" ]]; then
	printf '\nERROR: %s is missing.\n' "$SECRET_FILE" >&2
	return 1 2>/dev/null || exit 1
fi

set -a
source "$SECRET_FILE"
set +a

if [[ -z "${POSTGRES_USER:-}" ]]; then
	printf '\nERROR: POSTGRES_USER is missing from %s.\n' "$SECRET_FILE" >&2
	return 1 2>/dev/null || exit 1
fi

if [[ -z "${POSTGRES_DB:-}" ]]; then
	printf '\nERROR: POSTGRES_DB is missing from %s.\n' "$SECRET_FILE" >&2
	return 1 2>/dev/null || exit 1
fi

if [[ -z "${TELEGRAF_POSTGRES_DSN:-}" ]]; then
	telegraf_encode_dsn_value() {
		printf '%s' "$1" | od -An -v -tx1 | awk '{ for (i = 1; i <= NF; i++) printf "%%%s", $i }'
	}
	telegraf_dsn_password="$(telegraf_encode_dsn_value "${TELEGRAF_POSTGRES_PASSWORD:-}")"
	telegraf_dsn_database="$(telegraf_encode_dsn_value "$POSTGRES_DB")"
	TELEGRAF_POSTGRES_DSN="postgresql://telegraf_reader:$telegraf_dsn_password@postgres:5432/$telegraf_dsn_database?sslmode=disable"
	unset -f telegraf_encode_dsn_value
	unset telegraf_dsn_password telegraf_dsn_database
fi
export TELEGRAF_POSTGRES_DSN

if [[ -z "${EMAIL_USER:-}" ]]; then
	printf '\nERROR: EMAIL_USER is missing from %s.\n' "$SECRET_FILE" >&2
	return 1 2>/dev/null || exit 1
fi

if [[ -z "${EMAIL_PASSWORD:-}" ]]; then
	printf '\nERROR: EMAIL_PASSWORD is missing from %s.\n' "$SECRET_FILE" >&2
	return 1 2>/dev/null || exit 1
fi

if [[ -z "${GRAFANA_ADMIN_USER:-}" ]]; then
	printf '\nERROR: GRAFANA_ADMIN_USER is missing from %s.\n' "$SECRET_FILE" >&2
	return 1 2>/dev/null || exit 1
fi

if [[ -z "${GRAFANA_ADMIN_PASSWORD:-}" ]]; then
	printf '\nERROR: GRAFANA_ADMIN_PASSWORD is missing from %s.\n' "$SECRET_FILE" >&2
	return 1 2>/dev/null || exit 1
fi
