FROM node:latest

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
EXPOSE 5173
