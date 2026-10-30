# Multi-stage Docker build for AutoReply Arabic
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies for build
RUN npm ci

# Copy application source code
COPY . .

# Build Vite client and bundle server
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data 2>/dev/null || true

EXPOSE 3000

CMD ["node", "dist/server.js"]
