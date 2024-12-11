FROM node:23-alpine
WORKDIR /app
COPY backend/package*.json .
RUN npm install --only=production
COPY . .
EXPOSE 4000
