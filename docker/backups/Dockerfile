FROM alpine:3.24
WORKDIR /app
COPY backups.sh .
ENV POSTGRES_HOST=postgres

RUN apk add --no-cache postgresql18-client

CMD ["./backups.sh"]
