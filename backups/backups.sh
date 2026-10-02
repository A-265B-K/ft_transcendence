#!/bin/sh
set -e 

shutdown()
{
    exit 0 ;
}

trap shutdown TERM INT

# _____________________________________________________________
if [ ! -s "$BACKUPS_VAULT_TOKEN_FILE" ]; then
    echo "Backups Vault token file is missing or empty." >&2
    exit 1
fi

export VAULT_TOKEN
VAULT_TOKEN="$(cat "$BACKUPS_VAULT_TOKEN_FILE")"

POSTGRES_USER="$(vault kv get -field=username app/backups)"
POSTGRES_PASSWORD="$(vault kv get -field=password app/backups)"
POSTGRES_DB="$(vault kv get -field=database app/backups)"

if [ -z "$POSTGRES_USER" ] ||
   [ -z "$POSTGRES_PASSWORD" ] ||
   [ -z "$POSTGRES_DB" ]; then
    echo "Failed to load PostgreSQL credentials from Vault." >&2
    exit 1
fi
# _____________________________________________________________

while true ; do 
    echo "backup in progress"
    archive=$(date "+Backup-%Y-%m-%d-%H-%M").tar.gz
    mkdir -p tmp

    PGPASSWORD="$POSTGRES_PASSWORD" \
        pg_dump \
            -h postgres \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            > tmp/postgres.sql

    tar -czf "backups/$archive" -C tmp .

    rm -rf tmp
    
    cd backups 
    ls | sort | head -n -10 | xargs -r rm 
    cd ../ 
    
    for _ in $(seq 1 100); do
        sleep 3
    done
done