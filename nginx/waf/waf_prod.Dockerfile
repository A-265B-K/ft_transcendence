FROM node:26-alpine AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# copy owasp modesecurity image's digest directly
FROM owasp/modsecurity-crs:nginx@sha256:133267aa811e1a57a23b52ef04b3c30e802bcbe5454588f6d6af1f69f4b2b667

USER root

# Replace the image's default proxy server with the project routing below.
RUN rm /etc/nginx/templates/conf.d/default.conf.template

# Custom NGINX routing configuration
COPY nginx/waf/default.conf.template \
    /etc/nginx/templates/conf.d/default.conf.template

# Custom ModSecurity exclusions
COPY nginx/waf/socketio-exclusions.conf \
    /etc/modsecurity.d/socketio-exclusions.conf

# Include exclusions before CRS rules
COPY nginx/waf/modsecurity-override.conf.template \
    /etc/nginx/templates/modsecurity.d/modsecurity-override.conf.template

# Built frontend and legal pages.
COPY --from=frontend /app/dist/ /var/www/frontend/
COPY nginx/pages/ /var/www/pages/

# No need for ssl certificates
# OWASP CRS container generates a self-signed certificate on start-up


RUN chmod -R a+rX /var/www/frontend /var/www/pages

USER nginx