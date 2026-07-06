FROM node:latest

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY src ./src
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
