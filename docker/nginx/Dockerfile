FROM alpine/openssl:3.5.7 as certs

RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:*.localhost" \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt

FROM nginx:1.30.4

COPY --from=certs /etc/nginx/ssl/nginx.key /etc/nginx/ssl/nginx.key
COPY --from=certs /etc/nginx/ssl/nginx.crt /etc/nginx/ssl/nginx.crt

CMD ["nginx", "-g", "daemon off;"]