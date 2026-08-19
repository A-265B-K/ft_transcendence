FROM node:26.7.0-alpine
WORKDIR /workspace
COPY package.json package-lock.json ./

RUN npm ci

WORKDIR /workspace/app
CMD [ "../node_modules/.bin/vite", "--host", "0.0.0.0" ]
