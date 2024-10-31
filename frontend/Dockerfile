FROM node:23-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm build

FROM node:23-alpine AS prod
WORKDIR /app
COPY --from=builder /app/build .
COPY --from=builder /app/package*.json .
RUN npm run install --only=production
EXPOSE 3000
