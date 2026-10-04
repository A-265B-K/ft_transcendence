#!/usr/bin/env bash

# ------------------------------------------------------------
# core script imports
# ------------------------------------------------------------
source ./scripts/common.sh
source ./scripts/config.sh

# ------------------------------------------------------------
# vault libraries
# ------------------------------------------------------------
source ./scripts/vault_scripts/vault_app_kv.sh
source ./scripts/vault_scripts/vault_initialization.sh
source ./scripts/vault_scripts/vault_load_root_token.sh
source ./scripts/vault_scripts/vault_state_detection.sh
source ./scripts/vault_scripts/vault_unseal.sh
for script in ./scripts/vault_scripts/token_creation/*.sh; do
    source "$script"
done
for script in ./scripts/vault_scripts/credentials_loading/*.sh; do
    source "$script"
done
for script in ./scripts/vault_scripts/credentials_storing/*.sh; do
    source "$script"
done

# ------------------------------------------------------------
# Grafana library
# ------------------------------------------------------------
source ./scripts/grafana_scripts/grafana_fix_permission.sh

# ------------------------------------------------------------
# PostgreSQL libraries
# ------------------------------------------------------------
for script in ./scripts/postgres_scripts/*.sh; do
    source "$script"
done

# ------------------------------------------------------------
# Variables
# ------------------------------------------------------------

POSTGRES_APP_PASSWORD=""
POSTGRES_EXPORTER_PASSWORD=""
POSTGRES_BACKUPS_PASSWORD=""

# ------------------------------------------------------------
# Pre-Checks
# ------------------------------------------------------------

require_docker

if [[ ! -f "$SECRET_FILE" ]]; then
	die "Secret file '$SECRET_FILE' not found."
fi

if [[ ! -r "$SECRET_FILE" ]]; then
	die "Secret file '$SECRET_FILE' is not readable."
fi

SECRET_PERMS="$(stat -c '%a' "$SECRET_FILE")"

if [[ "$SECRET_PERMS" != "600" ]]; then
	die "Secret file '$SECRET_FILE' must have permissions 600."
fi

if [[ ! -f "$COMPOSE_FILE_DEV" ]]; then
	die "$COMPOSE_FILE_DEV not found."
fi

if [[ ! -f "$BOOTSTRAP_COMPOSE_FILE_DEV" ]]; then
	die "$BOOTSTRAP_COMPOSE_FILE_DEV not found."
fi

if ! command -v openssl >/dev/null 2>&1; then
	die "OpenSSL is not installed."
fi

if ! mkdir -p "$VAULT_TOKEN_DIR"; then
    die "Failed to create Vault token directory."
fi

if ! chmod 700 "$VAULT_TOKEN_DIR"; then
    die "Failed to secure Vault token directory."
fi

log "Loading bootstrap configuration..."
source ./scripts/load-env.sh
log "Bootstrap configuration loaded."

log "Checking Docker Compose configuration..."
if ! docker compose \
	-f "$COMPOSE_FILE_DEV" \
	config >/dev/null
then
	die "Docker Compose configuration is invalid."
fi
log "Bootstrap pre-checks passed."

# ------------------------------------------------------------
# Start Vault
# ------------------------------------------------------------

log "Starting Vault..."
if ! docker compose \
	-f "$COMPOSE_FILE_DEV" \
	up -d vault-init vault
then
	die "Failed to start Vault."
fi

# ------------------------------------------------------------
# Wait for Vault to be ready/healthy
# ------------------------------------------------------------

log "Waiting for Vault..."
VAULT_HEALTH=""

for _ in {1..30}; do
	VAULT_HEALTH="$(
		docker inspect \
			--format '{{.State.Health.Status}}' \
			"$VAULT_CONTAINER" 2>/dev/null || true
	)"

	if [[ "$VAULT_HEALTH" == "healthy" ]]; then
		break
	fi

	sleep 1
done

if [[ "$VAULT_HEALTH" != "healthy" ]]; then
	die "Vault did not become healthy."
fi
log "Vault is healthy."

# ------------------------------------------------------------
# Vault state check
# ------------------------------------------------------------

log "Checking Vault state..."
if ! vault_is_initialized; then
	if [[ -e "$VAULT_SECRETS_FILE" ]]; then
		die "Vault is uninitialized but $VAULT_SECRETS_FILE already exists. Refusing to overwrite it."
	fi

	vault_initialize
else
	log "Vault is already initialized."
fi

if vault_is_sealed; then
	vault_unseal
else
	log "Vault is already unsealed."
fi

vault_ensure_app_kv
vault_store_email_credentials
vault_store_grafana_credentials

# ------------------------------------------------------------
# PostgreSQL state check
# ------------------------------------------------------------

log "Checking PostgreSQL state..."
if postgres_is_initialized; then
	POSTGRES_INITIALIZED=true
	log "PostgreSQL data directory is already initialized."
else
	POSTGRES_INITIALIZED=false
	log "PostgreSQL data directory is empty."
fi

# ------------------------------------------------------------
# PostgreSQL bootstrap credentials
# ------------------------------------------------------------

POSTGRES_ADMIN_PASSWORD=""

if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
	log "Generating PostgreSQL admin password..."

	POSTGRES_ADMIN_PASSWORD="$(openssl rand -hex 32)"

	if [[ -z "$POSTGRES_ADMIN_PASSWORD" ]]; then
		die "Failed to generate PostgreSQL admin password."
	fi

	BOOTSTRAP_POSTGRES_PASSWORD_FILE="$(mktemp)"

	chmod 600 "$BOOTSTRAP_POSTGRES_PASSWORD_FILE"

	printf '%s' "$POSTGRES_ADMIN_PASSWORD" \
		> "$BOOTSTRAP_POSTGRES_PASSWORD_FILE"

	export BOOTSTRAP_POSTGRES_PASSWORD_FILE

	cleanup() {
		rm -f "$BOOTSTRAP_POSTGRES_PASSWORD_FILE"
	}

	trap cleanup EXIT

	log "Temporary PostgreSQL credential created."
else
	log "Loading existing PostgreSQL admin credentials from Vault..."
	vault_load_postgres_admin_password
fi

# ------------------------------------------------------------
# Start PostgreSQL
# ------------------------------------------------------------

log "Starting PostgreSQL..."
if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
	docker compose \
		-f "$COMPOSE_FILE_DEV" \
		-f "$BOOTSTRAP_COMPOSE_FILE_DEV" \
		up -d postgres
else
	docker compose \
		-f "$COMPOSE_FILE_DEV" \
		up -d postgres
fi

# ------------------------------------------------------------
# Wait for PostgreSQL
# ------------------------------------------------------------

log "Waiting for PostgreSQL..."
if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
	POSTGRES_COMPOSE=(
		-f "$COMPOSE_FILE_DEV"
		-f "$BOOTSTRAP_COMPOSE_FILE_DEV"
	)
else
	POSTGRES_COMPOSE=(
		-f "$COMPOSE_FILE_DEV"
	)
fi

POSTGRES_READY=false

for _ in {1..30}; do
    if docker compose \
        "${POSTGRES_COMPOSE[@]}" \
        exec -T postgres \
        pg_isready \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            >/dev/null 2>&1
    then
        POSTGRES_READY=true
        break
    fi

    sleep 1
done

[[ "$POSTGRES_READY" == "true" ]] ||
    die "PostgreSQL did not become ready."

log "PostgreSQL is ready."

# ------------------------------------------------------------
# Verify PostgreSQL authentication
# ------------------------------------------------------------

if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
	log "Verifying PostgreSQL password authentication..."

	docker compose \
		-f "$COMPOSE_FILE_DEV" \
		-f "$BOOTSTRAP_COMPOSE_FILE_DEV" \
		exec -T postgres \
		env PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" \
		psql \
			-h 127.0.0.1 \
			-U "$POSTGRES_USER" \
			-d "$POSTGRES_DB" \
			-c 'SELECT 1;' \
			>/dev/null \
		|| die "PostgreSQL password authentication failed."

	log "PostgreSQL password authentication verified."

	vault_store_postgres_credentials
else
	log "PostgreSQL was already initialized; bootstrap password verification skipped."
fi

# ------------------------------------------------------------
# PostgreSQL application role
# ------------------------------------------------------------

if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
	log "Generating PostgreSQL application password..."

	POSTGRES_APP_PASSWORD="$(openssl rand -hex 32)"

	if [[ -z "$POSTGRES_APP_PASSWORD" ]]; then
		die "Failed to generate PostgreSQL application password."
	fi

	postgres_ensure_app_role
	vault_store_postgres_app_credentials
else
	vault_load_postgres_app_password
	postgres_ensure_app_role
fi


# ------------------------------------------------------------
# PostgreSQL exporter role
# ------------------------------------------------------------

if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
	log "Generating PostgreSQL exporter password..."

	POSTGRES_EXPORTER_PASSWORD="$(openssl rand -hex 32)"

	if [[ -z "$POSTGRES_EXPORTER_PASSWORD" ]]; then
		die "Failed to generate PostgreSQL exporter password."
	fi

	postgres_ensure_exporter_role
	vault_store_postgres_exporter_credentials
else
	vault_load_postgres_exporter_password
	postgres_ensure_exporter_role
fi


# ------------------------------------------------------------
# PostgreSQL backups role
# ------------------------------------------------------------

if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
	log "Generating PostgreSQL backups password..."

	POSTGRES_BACKUPS_PASSWORD="$(openssl rand -hex 32)"

	if [[ -z "$POSTGRES_BACKUPS_PASSWORD" ]]; then
		die "Failed to generate PostgreSQL backups password."
	fi

	postgres_ensure_backups_role
	vault_store_postgres_backups_credentials
else
	vault_load_postgres_backups_password
	postgres_ensure_backups_role
fi

# ------------------------------------------------------------
# Scoped Vault tokens
# ------------------------------------------------------------

vault_ensure_backend_token
vault_ensure_exporter_vault_token
vault_ensure_grafana_token
vault_ensure_backups_token
./scripts/grafana_scripts/grafana_write_secret_files.sh

log "PostgreSQL bootstrap stage completed."