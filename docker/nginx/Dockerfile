FROM nginx:latest

RUN apt update && apt install -y openssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -subj "/CN=transcendence.game" -addext "subjectAltName=DNS:transcendence.game" -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt

COPY game.conf /etc/nginx/conf.d/default.conf
