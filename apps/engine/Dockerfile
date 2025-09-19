# Railway-compatible Dockerfile for ZEKE Engine (Core RSS Processing)
# YouTube processing is optional and will be skipped if YOUTUBE_API_KEY is not provided
# Cache bust: 2025-09-15-v3-clean-build
FROM node:20-alpine

WORKDIR /app

# Install minimal system dependencies for core functionality (Alpine)
RUN apk add --no-cache \
    curl \
    ca-certificates

# Copy package files
COPY package.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npx tsc -p tsconfig.json

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Set production environment
ENV NODE_ENV=production

# Disable YouTube processing by default (can be enabled by setting YOUTUBE_API_KEY)
ENV YOUTUBE_PROCESSING_ENABLED=false

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Health check - Railway-optimized
HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8080}/healthz || exit 1

# Start the application
CMD ["node", "dist/engine.js"]
