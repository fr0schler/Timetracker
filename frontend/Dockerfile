# Optimized multi-stage build
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) with cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# Copy source and build
COPY . .
ENV VITE_API_URL=https://timeapi.hkp-solutions.de
RUN NODE_OPTIONS="--max_old_space_size=4096" npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install serve globally with cache
RUN --mount=type=cache,target=/root/.npm \
    npm install -g serve

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]