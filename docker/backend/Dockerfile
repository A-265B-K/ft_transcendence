FROM node:26.7.0-alpine
WORKDIR /app
COPY package.json package-lock.json ./

RUN npm install

CMD [ "npx", "tsx", "backend/srcs/server.ts" ]
