#!/usr/bin/env bash

# ------------------------------------------------------------
# Variables
# ------------------------------------------------------------

# make sure the script stops as soon as something goes wrong
set -Eeuo pipefail

VAULT_CONTAINER="vault"

# imported file with secrets
SECRET_FILE=".secret"

# created file with vault unseal key as well as root token
VAULT_SECRETS_FILE=".vault_secrets"

BACKEND_VAULT_TOKEN_FILE=".backend_vault_token"
BACKEND_VAULT_POLICY="transcendence-backend"

COMPOSE_FILE="docker-compose-dev.yaml"
BOOTSTRAP_COMPOSE_FILE="docker-compose-bootstrap.yaml"

POSTGRES_VOLUME="${POSTGRES_VOLUME_NAME:-ft_transcendence_postgres_data}"

POSTGRES_USER=""
POSTGRES_DB=""
POSTGRES_ADMIN_PASSWORD=""
POSTGRES_APP_USERNAME=""
POSTGRES_APP_PASSWORD=""

# ------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------

log() {
	echo
	echo "==> $*"
}

die() {
	echo
	echo "ERROR: $*" >&2
	exit 1
}

# ------------------------------------------------------------
# Vault backend token
# ------------------------------------------------------------

vault_ensure_backend_token() {
    local vault_root_token
    local backend_token

    if [[ ! -f "$VAULT_SECRETS_FILE" ]]; then
        die "Vault credentials file '$VAULT_SECRETS_FILE' not found."
    fi

    if [[ "$(stat -c '%a' "$VAULT_SECRETS_FILE")" != "600" ]]; then
        die "$VAULT_SECRETS_FILE must have permissions 600."
    fi

    vault_root_token="$(
        sed -n 's/^VAULT_ROOT_TOKEN=//p' "$VAULT_SECRETS_FILE"
    )"

    if [[ -z "$vault_root_token" ]]; then
        die "Vault root token is missing."
    fi

    # Reuse the existing backend token if it is still valid
    # and can read the backend's allowed secret.
    if [[ -s "$BACKEND_VAULT_TOKEN_FILE" ]]; then
        chmod 600 "$BACKEND_VAULT_TOKEN_FILE"

        if docker exec \
            -e VAULT_TOKEN="$(cat "$BACKEND_VAULT_TOKEN_FILE")" \
            "$VAULT_CONTAINER" \
            vault kv get \
                -field=username \
                app/postgres-app \
                >/dev/null 2>&1
        then
            unset vault_root_token
            log "Existing backend Vault token is valid; reusing it."
            return 0
        fi

        log "Existing backend Vault token is invalid; creating a new one."
    else
        log "Backend Vault token not found; creating one."
    fi

    # Ensure the backend policy exists and has only the required read access.
    log "Ensuring backend Vault policy..."

    if ! printf '%s\n' \
        'path "app/data/postgres-app" {' \
        '  capabilities = ["read"]' \
        '}' |
        docker exec -i \
            -e VAULT_TOKEN="$vault_root_token" \
            "$VAULT_CONTAINER" \
            vault policy write \
                "$BACKEND_VAULT_POLICY" \
                - \
                >/dev/null
    then
        unset vault_root_token
        die "Failed to create/update backend Vault policy."
    fi

    log "Creating scoped backend Vault token..."

    backend_token="$(
        docker exec \
            -e VAULT_TOKEN="$vault_root_token" \
            "$VAULT_CONTAINER" \
            vault token create \
                -policy="$BACKEND_VAULT_POLICY" \
                -ttl=24h \
                -renewable=true \
                -field=token
    )" || {
        unset vault_root_token
        die "Failed to create backend Vault token."
    }

    if [[ -z "$backend_token" ]]; then
        unset vault_root_token
        die "Vault returned an empty backend token."
    fi

    (
        umask 077
        printf '%s\n' "$backend_token" > "$BACKEND_VAULT_TOKEN_FILE"
    )

    chmod 600 "$BACKEND_VAULT_TOKEN_FILE"

    unset backend_token
    unset vault_root_token

    log "Backend Vault token created and saved to $BACKEND_VAULT_TOKEN_FILE."
}

# ------------------------------------------------------------
# Vault state detection functions
# ------------------------------------------------------------

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

# ------------------------------------------------------------
# Vault initialization and save of the unseal keys and root token
# ------------------------------------------------------------

vault_initialize() {
	log "Initializing Vault..."

	local init_output
	local root_token
	local unseal_key_1
	local unseal_key_2
	local unseal_key_3
	local unseal_key_4
	local unseal_key_5

	if ! init_output="$(
		docker exec "$VAULT_CONTAINER" \
			vault operator init \
			-key-shares=5 \
			-key-threshold=3
	)"; then
		die "Vault initialization failed."
	fi

	root_token="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Initial Root Token: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_1="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 1: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_2="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 2: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_3="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 3: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_4="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 4: \([^[:space:]]*\)$/\1/p'
	)"

	unseal_key_5="$(
		printf '%s\n' "$init_output" |
			sed -n 's/^Unseal Key 5: \([^[:space:]]*\)$/\1/p'
	)"

	if [[ -z "$root_token" ||
		  -z "$unseal_key_1" ||
		  -z "$unseal_key_2" ||
		  -z "$unseal_key_3" ||
		  -z "$unseal_key_4" ||
		  -z "$unseal_key_5" ]]; then
		die "Failed to extract Vault initialization credentials."
	fi

	if [[ -e "$VAULT_SECRETS_FILE" ]]; then
		die "$VAULT_SECRETS_FILE already exists. Refusing to overwrite it."
	fi

	(
		umask 077

		cat > "$VAULT_SECRETS_FILE" <<EOF
VAULT_ROOT_TOKEN=$root_token
VAULT_UNSEAL_KEY_1=$unseal_key_1
VAULT_UNSEAL_KEY_2=$unseal_key_2
VAULT_UNSEAL_KEY_3=$unseal_key_3
VAULT_UNSEAL_KEY_4=$unseal_key_4
VAULT_UNSEAL_KEY_5=$unseal_key_5
EOF
	)

	chmod 600 "$VAULT_SECRETS_FILE"

	unset init_output
	unset root_token
	unset unseal_key_1
	unset unseal_key_2
	unset unseal_key_3
	unset unseal_key_4
	unset unseal_key_5

	log "Vault initialization credentials saved to $VAULT_SECRETS_FILE."
	sleep 2
}

# ------------------------------------------------------------
# Vault unseal
# ------------------------------------------------------------

vault_unseal() {
	if [[ ! -f "$VAULT_SECRETS_FILE" ]]; then
		die "Vault is sealed but $VAULT_SECRETS_FILE does not exist."
	fi

	if [[ "$(stat -c '%a' "$VAULT_SECRETS_FILE")" != "600" ]]; then
		die "$VAULT_SECRETS_FILE must have permissions 600."
	fi

	# export all variable from VAULT_SECRETS_FILE to the shell
	set -a
	source "$VAULT_SECRETS_FILE"
	set +a

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

# ------------------------------------------------------------
# Vault create KV v2 (Key-Value v2)
# ------------------------------------------------------------

vault_ensure_app_kv() {
	log "Checking Vault app KV engine..."

	if [[ ! -f "$VAULT_SECRETS_FILE" ]]; then
		die "Cannot configure Vault app KV engine: $VAULT_SECRETS_FILE not found."
	fi

	if [[ "$(stat -c '%a' "$VAULT_SECRETS_FILE")" != "600" ]]; then
		die "$VAULT_SECRETS_FILE must have permissions 600."
	fi

	local vault_root_token
	local secrets_list

	vault_root_token="$(
		sed -n 's/^VAULT_ROOT_TOKEN=//p' "$VAULT_SECRETS_FILE"
	)"

	if [[ -z "$vault_root_token" ]]; then
		die "Vault root token is missing from $VAULT_SECRETS_FILE."
	fi

	secrets_list="$(
		docker exec \
			-e VAULT_TOKEN="$vault_root_token" \
			"$VAULT_CONTAINER" \
			vault secrets list -format=json
	)" || {
		unset vault_root_token
		die "Failed to inspect Vault secret engines."
	}

	if printf '%s\n' "$secrets_list" | grep -q '"app/"'; then
		unset vault_root_token
		log "Vault app KV engine already exists."
		return 0
	fi

	log "Enabling Vault app KV engine..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		"$VAULT_CONTAINER" \
		vault secrets enable \
			-path=app \
			kv-v2 \
			>/dev/null
	then
		unset vault_root_token
		die "Failed to enable Vault app KV engine."
	fi

	unset vault_root_token

	log "Vault app KV engine enabled."
}

# ------------------------------------------------------------
# Vault store PostGres credentials (admin credentials)
# ------------------------------------------------------------

vault_store_postgres_credentials() {
	local vault_root_token

	if [[ -z "${POSTGRES_ADMIN_PASSWORD:-}" ]]; then
		die "PostgreSQL password is not available."
	fi

	if [[ ! -f "$VAULT_SECRETS_FILE" ]]; then
		die "Vault credentials file '$VAULT_SECRETS_FILE' not found."
	fi

	vault_root_token="$(
		sed -n 's/^VAULT_ROOT_TOKEN=//p' "$VAULT_SECRETS_FILE"
	)"

	if [[ -z "$vault_root_token" ]]; then
		die "Vault root token is missing."
	fi

	log "Storing PostgreSQL credentials in Vault..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		-e POSTGRES_USERNAME="$POSTGRES_USER" \
		-e POSTGRES_PASSWORD="$POSTGRES_ADMIN_PASSWORD" \
		-e POSTGRES_DATABASE="$POSTGRES_DB" \
		"$VAULT_CONTAINER" \
		sh -c '
			vault kv put app/postgres \
				username="$POSTGRES_USERNAME" \
				password="$POSTGRES_PASSWORD" \
				database="$POSTGRES_DATABASE"
		' >/dev/null
	then
		unset vault_root_token
		die "Failed to store PostgreSQL credentials in Vault."
	fi

	unset vault_root_token

	log "PostgreSQL credentials stored in Vault."
}

# ------------------------------------------------------------
# Vault load PostGres credentials
# ------------------------------------------------------------

vault_load_postgres_admin_password() {
    local vault_root_token

    if [[ ! -f "$VAULT_SECRETS_FILE" ]]; then
        die "Vault credentials file '$VAULT_SECRETS_FILE' not found."
    fi

    vault_root_token="$(
        sed -n 's/^VAULT_ROOT_TOKEN=//p' "$VAULT_SECRETS_FILE"
    )"

    if [[ -z "$vault_root_token" ]]; then
        die "Vault root token is missing."
    fi

    log "Loading PostgreSQL admin password from Vault..."

    POSTGRES_ADMIN_PASSWORD="$(
        docker exec \
            -e VAULT_TOKEN="$vault_root_token" \
            "$VAULT_CONTAINER" \
            vault kv get \
                -field=password \
                app/postgres
    )" || {
        unset vault_root_token
        die "Failed to retrieve PostgreSQL admin password from Vault."
    }

    unset vault_root_token

    if [[ -z "$POSTGRES_ADMIN_PASSWORD" ]]; then
        die "PostgreSQL admin password retrieved from Vault is empty."
    fi
}

# ------------------------------------------------------------
# Vault store PostGres app credentials (user credentials)
# ------------------------------------------------------------

vault_store_postgres_app_credentials() {
	local vault_root_token

	if [[ -z "${POSTGRES_APP_PASSWORD:-}" ]]; then
		die "PostgreSQL application password is not available."
	fi

	if [[ ! -f "$VAULT_SECRETS_FILE" ]]; then
		die "Vault credentials file '$VAULT_SECRETS_FILE' not found."
	fi

	vault_root_token="$(
		sed -n 's/^VAULT_ROOT_TOKEN=//p' "$VAULT_SECRETS_FILE"
	)"

	if [[ -z "$vault_root_token" ]]; then
		die "Vault root token is missing."
	fi

	log "Storing PostgreSQL application credentials in Vault..."

	if ! docker exec \
		-e VAULT_TOKEN="$vault_root_token" \
		-e POSTGRES_APP_USERNAME="transcendence_app" \
		-e POSTGRES_APP_PASSWORD="$POSTGRES_APP_PASSWORD" \
		-e POSTGRES_DATABASE="$POSTGRES_DB" \
		"$VAULT_CONTAINER" \
		sh -c '
			vault kv put app/postgres-app \
				username="$POSTGRES_APP_USERNAME" \
				password="$POSTGRES_APP_PASSWORD" \
				database="$POSTGRES_DATABASE"
		' >/dev/null
	then
		unset vault_root_token
		die "Failed to store PostgreSQL application credentials in Vault."
	fi

	unset vault_root_token

	log "PostgreSQL application credentials stored in Vault."
}

# ------------------------------------------------------------
# Vault load PostGres app credentials
# ------------------------------------------------------------

vault_load_postgres_app_password() {
    local vault_root_token

    if [[ ! -f "$VAULT_SECRETS_FILE" ]]; then
        die "Vault credentials file '$VAULT_SECRETS_FILE' not found."
    fi

    vault_root_token="$(
        sed -n 's/^VAULT_ROOT_TOKEN=//p' "$VAULT_SECRETS_FILE"
    )"

    if [[ -z "$vault_root_token" ]]; then
        die "Vault root token is missing."
    fi

    log "Loading PostgreSQL application password from Vault..."

    POSTGRES_APP_PASSWORD="$(
        docker exec \
            -e VAULT_TOKEN="$vault_root_token" \
            "$VAULT_CONTAINER" \
            vault kv get \
                -field=password \
                app/postgres-app
    )" || {
        unset vault_root_token
        die "Failed to retrieve PostgreSQL application password from Vault."
    }

    unset vault_root_token

    if [[ -z "$POSTGRES_APP_PASSWORD" ]]; then
        die "PostgreSQL application password retrieved from Vault is empty."
    fi
}

# ------------------------------------------------------------
# PostgreSQL creation of app role
# ------------------------------------------------------------

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

# ------------------------------------------------------------
# PostgreSQL state detection
# ------------------------------------------------------------

postgres_is_initialized() {
	docker run --rm \
		-v "${POSTGRES_VOLUME}:/var/lib/postgresql" \
		postgres:18.4 \
		sh -c 'test -s "$PGDATA/PG_VERSION"'
}

# ------------------------------------------------------------
# Pre-Checks
# ------------------------------------------------------------

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

if ! command -v docker >/dev/null 2>&1; then
	die "Docker is not installed."
fi

if ! docker compose version >/dev/null 2>&1; then
	die "Docker Compose is not available."
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
	die "$COMPOSE_FILE not found."
fi

if [[ ! -f "$BOOTSTRAP_COMPOSE_FILE" ]]; then
	die "$BOOTSTRAP_COMPOSE_FILE not found."
fi

if ! command -v openssl >/dev/null 2>&1; then
	die "OpenSSL is not installed."
fi

# ------------------------------------------------------------
# Pre-Check: load required configuration
# ------------------------------------------------------------

log "Loading bootstrap configuration..."

source ./scripts/load-env.sh

unset POSTGRES_PASSWORD
unset DATA_SOURCE_PASS
unset EMAIL_PASSWORD
unset GRAFANA_ADMIN_PASSWORD

log "Bootstrap configuration loaded."

log "Checking Docker Compose configuration..."

if ! docker compose \
	-f "$COMPOSE_FILE" \
	config >/dev/null
then
	die "Docker Compose configuration is invalid."
fi

log "Bootstrap pre-flight checks passed."

# ------------------------------------------------------------
# Start Vault
# ------------------------------------------------------------

log "Starting Vault..."

if ! docker compose \
	-f "$COMPOSE_FILE" \
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
		-f "$COMPOSE_FILE" \
		-f "$BOOTSTRAP_COMPOSE_FILE" \
		up -d postgres
else
	docker compose \
		-f "$COMPOSE_FILE" \
		up -d postgres
fi

# ------------------------------------------------------------
# Wait for PostgreSQL
# ------------------------------------------------------------

log "Waiting for PostgreSQL..."

if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
    POSTGRES_COMPOSE=(
        -f "$COMPOSE_FILE"
        -f "$BOOTSTRAP_COMPOSE_FILE"
    )
else
    POSTGRES_COMPOSE=(
        -f "$COMPOSE_FILE"
    )
fi

until docker compose \
    "${POSTGRES_COMPOSE[@]}" \
    exec -T postgres \
    pg_isready \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        >/dev/null 2>&1
do
    sleep 1
done

log "PostgreSQL is ready."

# ------------------------------------------------------------
# Verify PostgreSQL authentication
# ------------------------------------------------------------

if [[ "$POSTGRES_INITIALIZED" == "false" ]]; then
	log "Verifying PostgreSQL password authentication..."

	docker compose \
		-f "$COMPOSE_FILE" \
		-f "$BOOTSTRAP_COMPOSE_FILE" \
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

vault_ensure_backend_token

log "PostgreSQL bootstrap stage completed."