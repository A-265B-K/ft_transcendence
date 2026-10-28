FROM alpine:3.24
WORKDIR /app
COPY backups.sh .
RUN chmod +x backups.sh

RUN apk add --no-cache postgresql18-client curl unzip

ARG VAULT_VERSION=1.20.4

RUN curl -fsSL \
    "https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip" \
    -o /tmp/vault.zip \
    && unzip /tmp/vault.zip -d /usr/local/bin \
    && rm /tmp/vault.zip \
    && chmod +x /usr/local/bin/vault

CMD ["./backups.sh"]
