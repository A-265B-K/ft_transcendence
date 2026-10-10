# Bootstrap scripts

This directory contains the project automation layer used to initialize and run the ft_transcendence stack.

The bootstrap logic is responsible for preparing the environment, validating dependencies, starting Docker services, configuring Vault, and creating the database roles and credentials needed by the application.

## Purpose

The scripts in this folder handle the setup and bootstrapping of the full local environment, including:

- validating required tools and configuration
- loading environment variables
- starting and checking Docker services
- initializing and unsealing Vault
- creating Vault secret engines and scoped tokens
- provisioning PostgreSQL users/roles/passwords
- writing secret files for Grafana and other services

## Main entry points

The usual public commands are defined in the repository root [Makefile](../Makefile):

```bash
make init
make dev
make prod
make down
make restart
make fclean
```

The main bootstrap script is:

```bash
./scripts/bootstrap.sh
```

This is the orchestration entry point that wires together the smaller components.

## Directory structure

- `bootstrap.sh` — main end-to-end bootstrap flow
- `common.sh` — shared logging, error handling, and validation helpers
- `config.sh` — default file paths, container names, and Vault/PostgreSQL configuration constants
- `load-env.sh` — loads project environment variables
- `vault_scripts/` — Vault initialization, unseal, token creation, and secret storage/loading logic
- `postgres_scripts/` — PostgreSQL role creation and credential setup
- `grafana_scripts/` — Grafana secrets and token file generation
- `makefile/` — project lifecycle commands used by the main Make targets

## Bootstrap flow

The bootstrap process follows this sequence:

1. Validate Docker and required files
2. Check that `.secret` exists and has the correct permissions
3. Ensure the Vault token directory exists and is secured
4. Load environment configuration
5. Start the Vault container and wait for it to become healthy
6. Initialize Vault if needed and persist the root token / unseal keys to `.vault_secrets`
7. Unseal Vault
8. Enable the `app/` KV v2 engine and configure project secrets
9. Start PostgreSQL and wait for it to become ready
10. Verify PostgreSQL access and generate database credentials when needed
11. Create application, exporter, and backups roles in PostgreSQL
12. Store credentials in Vault
13. Create service-specific Vault tokens
14. Generate Grafana secret files
15. Mark bootstrap completion

## Key files

### `common.sh`

This file defines shared helpers such as:

- `log()` for project status output
- `die()` for fail-fast error handling
- `require_docker()` for environment checks
- `require_file()` and `require_var()` for validating required configuration
- `require_initialized()` for checking whether Vault has already been initialized

### `config.sh`

This file centralizes the project’s fixed names and paths, including:

- `SECRET_FILE=".secret"`
- `VAULT_CONTAINER="vault"`
- `VAULT_TOKEN_DIR="tokens"`
- `VAULT_SECRETS_FILE=".vault_secrets"`
- `COMPOSE_FILE_DEV="docker-compose-dev.yaml"`
- `BOOTSTRAP_COMPOSE_FILE_DEV="docker-compose-bootstrap.yaml"`
- default Vault and PostgreSQL token names and policies

### `bootstrap.sh`

This is the main orchestration script and should be treated as the primary setup entry point. It brings together all initialization logic from the other subfolders.

## Typical usage

### First-time setup

```bash
make init
```

or directly:

```bash
./scripts/bootstrap.sh
```

### Development stack

```bash
make dev
```

### Production-like stack

```bash
make prod
```

### Clean reset

```bash
make fclean
make init
```

## Security and operational notes

- `.secret` and `.vault_secrets` must remain private and are not meant to be committed
- Vault token and secret files should be created with restricted permissions (`600` or `700` where needed)
- The root Vault token should not be used by applications directly; scoped tokens are preferred
- The bootstrap scripts assume a Docker-enabled local environment and will fail early if dependencies are missing
- Generated passwords and tokens are created at runtime and stored in Vault or secure token files

## Troubleshooting

If the bootstrap fails, check the following first:

- Docker is installed and the daemon is running
- `.secret` exists and is readable
- the required Docker Compose files are valid
- Vault is initialized and unsealed
- PostgreSQL is reachable and accepting credentials
- token files in `tokens/` are present and valid

Useful checks:

```bash
docker compose -f docker-compose-dev.yaml config

docker exec -it vault vault status

ls -l .secret .vault_secrets tokens
```

## Summary

The scripts folder is the project’s automation engine: it bootstraps the local environment, provisions secrets, initializes infrastructure, and keeps the development stack consistent across machines.
