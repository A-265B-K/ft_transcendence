FROM node:26-alpine AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM owasp/modsecurity-crs:nginx@sha256:133267aa811e1a57a23b52ef04b3c30e802bcbe5454588f6d6af1f69f4b2b667
COPY nginx/waf/socketio-exclusions.conf /etc/modsecurity.d/socketio-exclusions.conf
COPY nginx/waf/default.conf /etc/nginx/templates/modsecurity.d/default.conf

USER root

COPY --from=frontend /app/dist/ /var/www/frontend/
COPY nginx/pages/ /var/www/pages/

COPY nginx/waf/default.conf \
    /etc/nginx/templates/conf.d/default.conf

RUN chmod -R a+rX /var/www/frontend /var/www/pages

USER nginx