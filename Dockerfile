# Stage 1: build admin panel
FROM node:20-alpine AS admin-builder
WORKDIR /admin
COPY admin/package*.json ./
RUN npm install --legacy-peer-deps
COPY admin/ .
RUN npm run build

# Stage 2: build backend (needs compiler for better-sqlite3)
FROM node:20-alpine AS backend-builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --legacy-peer-deps
COPY backend/ .
RUN npm run build

# Stage 3: production runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/dist ./dist
COPY --from=admin-builder /admin/dist ./public
RUN mkdir -p uploads data backups
EXPOSE 3008
CMD ["node", "dist/main.js"]
