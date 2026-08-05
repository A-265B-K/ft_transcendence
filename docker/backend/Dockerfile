FROM node
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

CMD [ "node", "backend/srcs/server.js" ]