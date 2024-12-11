FROM node:23-alpine AS BASE
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .

FROM BASE AS TEST
RUN npm install
CMD ["npm","run","test"]

FROM node:23-alpine AS PRODUCTION
WORKDIR /app
COPY --from=BASE /app/node_modules ./node_modules
COPY --from=BASE /app ./
EXPOSE 4000
