FROM node:23-alpine AS builder
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files and build
COPY frontend/ .


RUN npm run build

FROM node:23-alpine AS prod
WORKDIR /app


COPY --from=builder /app/build ./
COPY --from=builder /app/package*.json ./
RUN npm install --only=production

EXPOSE 3000

