# Vault

This directory contains the configuration and documentation for the HashiCorp
Vault instance used by the project. Vault is the central store for passwords
and service credentials. Applications receive scoped Vault tokens instead of
the root token.

## Architecture

Vault runs as the `vault` service in
[`docker-compose-dev.yaml`](../docker-compose-dev.yaml) and
[`docker-compose.yaml`](../docker-compose.yaml).

- **Image:** `hashicorp/vault:1.20.4`
- **Address inside Docker:** `http://vault:8200`
- **Host address:** `http://127.0.0.1:8200`
- **Configuration:** [`config/vault.hcl`](config/vault.hcl)
- **Storage:** the Docker volume `vault_data`, mounted at `/vault/data`
- **Secrets engine:** KV version 2 mounted at `app/`
- **TLS:** disabled for the local Docker network; the service is bound to
  localhost on the host

The Vault configuration uses file storage and enables the web UI. This setup
is intended for the project environment and should not be exposed directly to
an untrusted network.

## Bootstrap flow

Vault is normally configured through the project bootstrap rather than by
running individual Vault commands:

```bash
make init
```

The bootstrap process, implemented in
[`scripts/bootstrap.sh`](../scripts/bootstrap.sh), does the following:

1. Starts Vault and waits for its health endpoint.
2. Initializes Vault once with five unseal keys and a threshold of three.
3. Stores the root token and unseal keys in `.vault_secrets` with mode `600`.
4. Applies three unseal keys when Vault is sealed.
5. Enables the KV v2 engine at `app/`.
6. Creates or updates PostgreSQL roles and stores their credentials.
7. Stores email and Grafana credentials.
8. Creates scoped service tokens and writes them under `tokens/`.

On later runs, existing valid service tokens are reused. If a token is no
longer valid, the corresponding token is recreated.

After initialization, start the development stack with:

```bash
make dev
```

For the production-like stack, use:

```bash
make prod
```

## Secret records

The bootstrap stores the following records in the `app/` KV v2 engine:

| Vault path | Stored values | Consumer |
| --- | --- | --- |
| `app/postgres` | `username`, `password`, `database` | Bootstrap scripts |
| `app/postgres-app` | `username`, `password`, `database` | Backend |
| `app/postgres_exporter` | `username`, `password`, `database` | PostgreSQL monitoring exporter |
| `app/backups` | `username`, `password`, `database` | Backup service |
| `app/email` | `username`, `password` | Backend email operations |
| `app/grafana` | `username`, `password` | Grafana secret-file generation |

The backend reads `app/postgres-app` and `app/email` through
[`backend/srcs/security/vault/client.ts`](../backend/srcs/security/vault/client.ts).
The monitoring exporter reads `app/postgres_exporter`, and the backup
container reads `app/backups`.

KV v2 API paths include the `data` segment. For example, the backend reads:

```text
GET http://vault:8200/v1/app/data/postgres-app
```

with the service token in the `X-Vault-Token` header.

## Scoped access tokens

The bootstrap creates renewable tokens with a one-year TTL. Each token can
only read the record required by its service:

| Token file | Policy | Allowed path |
| --- | --- | --- |
| `tokens/.backend_vault_token` | `transcendence-backend` | `app/data/postgres-app`, `app/data/email` |
| `tokens/.exporter_vault_token` | `transcendence-postgres_exporter` | `app/data/postgres_exporter` |
| `tokens/.grafana_vault_token` | `transcendence-grafana` | `app/data/grafana` |
| `tokens/.backups_vault_token` | `transcendence-backups` | `app/data/backups` |

These policies grant `read` only. The root token is used by bootstrap scripts
to configure Vault, but it must not be passed to application containers.

## Secret files and permissions

The following files are generated locally and are intentionally ignored by
Git:

- `.vault_secrets` — the Vault root token and five unseal keys
- `tokens/.backend_vault_token`
- `tokens/.exporter_vault_token`
- `tokens/.grafana_vault_token`
- `tokens/.backups_vault_token`
- `tokens/grafana/admin_user`
- `tokens/grafana/admin_password`

The bootstrap creates the token directory with mode `700` and token/secret
files with mode `600`. Do not commit these files, copy them into issue
reports, or share the root token or unseal keys.

The initial values used by bootstrap come from the local `.secret` file. Start
from [`.secret.example`](../.secret.example), fill in real local values, and
keep `.secret` private.

## Manual Vault commands

The project scripts are the recommended interface, but these commands are
useful for inspection. They assume the Vault container is running and the
root token is available.

Check the service state:

```bash
docker exec vault vault status
```

List mounted secret engines:

```bash
docker exec \
  -e VAULT_TOKEN="$(sed -n 's/^VAULT_ROOT_TOKEN=//p' .vault_secrets)" \
  vault vault secrets list
```

Read a record:

```bash
docker exec \
  -e VAULT_TOKEN="$(sed -n 's/^VAULT_ROOT_TOKEN=//p' .vault_secrets)" \
  vault vault kv get app/postgres-app
```

Write or update a record only when you understand the bootstrap contract:

```bash
docker exec \
  -e VAULT_TOKEN="$(sed -n 's/^VAULT_ROOT_TOKEN=//p' .vault_secrets)" \
  vault vault kv put app/example key="value"
```

The root token is not required for normal service operation. Avoid using
`vault login` interactively on shared terminals because shell history and
terminal logs may expose credentials.

## Recovery and reset

If Vault is sealed, the normal start script loads `.vault_secrets` and applies
the first three unseal keys:

```bash
COMPOSE_FILE=docker-compose-dev.yaml \
  ./scripts/vault_scripts/vault-start.sh
```

If `.vault_secrets` is missing while the existing Vault data volume is
initialized, the data cannot be safely recovered by the project scripts.
Restore the file from a protected backup or follow your Vault recovery
procedure.

To intentionally recreate the local environment, use the project lifecycle
commands:

```bash
make fclean
make init
```

This removes local project state and should only be used when losing the local
Vault data and credentials is acceptable.

## Relevant files

- [`config/vault.hcl`](config/vault.hcl) — Vault listener and storage config
- [`scripts/vault_scripts/vault_initialization.sh`](../scripts/vault_scripts/vault_initialization.sh) — first-time initialization
- [`scripts/vault_scripts/vault_unseal.sh`](../scripts/vault_scripts/vault_unseal.sh) — unsealing
- [`scripts/vault_scripts/vault_app_kv.sh`](../scripts/vault_scripts/vault_app_kv.sh) — KV engine setup
- [`scripts/vault_scripts/credentials_storing/`](../scripts/vault_scripts/credentials_storing/) — secret writers
- [`scripts/vault_scripts/credentials_loading/`](../scripts/vault_scripts/credentials_loading/) — bootstrap secret readers
- [`scripts/vault_scripts/token_creation/`](../scripts/vault_scripts/token_creation/) — scoped token and policy creation
- [`backend/srcs/security/vault/client.ts`](../backend/srcs/security/vault/client.ts) — backend Vault client
