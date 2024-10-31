FROM node:23-alpine
WORKDIR /app
COPY package*.json .
RUN npm install --only=production
COPY . .
EXPOSE 4000
