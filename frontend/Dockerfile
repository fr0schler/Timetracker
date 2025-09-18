# Multi-stage build for production optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install serve for production
RUN npm install -g serve

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Use serve for production, dev server for development
CMD ["serve", "-s", "dist", "-l", "3000"]