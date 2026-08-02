# shell for prostgres :
docker compose exec postgres sh
then --> psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"