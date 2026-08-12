FROM alpine:20260805
WORKDIR /app
COPY backups.sh .

RUN apk add --no-cache postgresql18-client

CMD ["./backups.sh"]
