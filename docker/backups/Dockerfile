FROM alpine:3.24
WORKDIR /app
COPY backups.sh .

RUN apk add --no-cache postgresql18-client

CMD ["./backups.sh"]
