postgres_is_initialized() {
	docker run --rm \
		-v "${POSTGRES_VOLUME}:/var/lib/postgresql" \
		postgres:18.4 \
		sh -c 'test -s "$PGDATA/PG_VERSION"'
}