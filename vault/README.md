# Generate vautl secret keys
docker exec -it vault vault operator init

# Log in with root token
docker exec -it vault vault login

# Check secret list (after root log in)
docker exec -it vault vault secrets list

# Create app secret store
docker exec -it vault vault secrets enable -path=app kv-v2

# Create a secret with KV v2 (Key/Value secrets engine v2)
docker exec -it vault vault kv put app/test \
  username="testuser" \
  password="testpassword"

# Read secret
docker exec -it vault vault kv get app/test

# Delete secret
docker exec -it vault vault kv delete app/test




### FOR VAULT
---> backend:
email user and password
change the way backend identify to vault (find a way around the backend_vault_token)
---> postgresexporter:
get postgres password and user from vault
---> grafana:
get credentials from vault
---> backups:
get postgres credentials from vault




### check backend token works
BACKEND_TOKEN="$(cat .backend_vault_token)"

docker exec \
  -e VAULT_TOKEN="$BACKEND_TOKEN" \
  vault \
  vault kv get app/postgres-app >/dev/null \
  && echo "backend token -> app/postgres-app: ALLOWED"

unset BACKEND_TOKEN


### temporary source for removing everything
source ./scripts/load-env.sh
docker compose -f docker-compose-dev.yaml down -v --remove-orphans
rm -rf .vault_secrets .backend_vault_token