# Base Stage
FROM node:23-alpine AS base
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .

# Test Stage
FROM base AS test
RUN npm install --only=development
CMD ["npm", "run", "test"]

# Production Stage
FROM node:23-alpine AS production
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app ./
EXPOSE 4000
