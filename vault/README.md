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