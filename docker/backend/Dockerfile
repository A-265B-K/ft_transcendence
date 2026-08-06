FROM node
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install



CMD [ "npx", "tsx", "backend/srcs/server.ts" ]
