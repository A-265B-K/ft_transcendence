SECRET_FILE=".secret"

VAULT_CONTAINER="vault"
VAULT_TOKEN_DIR="tokens"

# created file with vault unseal key as well as root token
VAULT_SECRETS_FILE=".vault_secrets"

BACKEND_VAULT_TOKEN_FILE="$VAULT_TOKEN_DIR/.backend_vault_token"
BACKEND_VAULT_POLICY="transcendence-backend"

POSTGRES_EXPORTER_VAULT_TOKEN_FILE="$VAULT_TOKEN_DIR/.exporter_vault_token"
POSTGRES_EXPORTER_VAULT_POLICY="transcendence-postgres_exporter"

GRAFANA_VAULT_TOKEN_FILE="$VAULT_TOKEN_DIR/.grafana_vault_token"
GRAFANA_VAULT_POLICY="transcendence-grafana"
GRAFANA_SECRETS_DIR="$VAULT_TOKEN_DIR/grafana"

BACKUPS_VAULT_TOKEN_FILE="$VAULT_TOKEN_DIR/.backups_vault_token"
BACKUPS_VAULT_POLICY="transcendence-backups"

COMPOSE_FILE_PROD="docker-compose.yaml"
COMPOSE_FILE_DEV="docker-compose-dev.yaml"
BOOTSTRAP_COMPOSE_FILE_DEV="docker-compose-bootstrap.yaml"

# maybe change later to just <POSTGRES_VOLUME="ft_transcendence_postgres_data"> if we don't want custume volume name
POSTGRES_VOLUME="${POSTGRES_VOLUME_NAME:-ft_transcendence_postgres_data}"