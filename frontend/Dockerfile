FROM node:23-alpine AS builder
WORKDIR /app
COPY frontend/package*.json .
RUN npm install
COPY frontend/ .
RUN npm run build

FROM node:23-alpine AS prod
WORKDIR /app
COPY --from=builder /app/build ./
COPY --from=builder /app/package*.json ./
RUN npm install --only=production

EXPOSE 3000

