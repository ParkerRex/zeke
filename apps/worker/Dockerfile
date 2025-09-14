# syntax=docker/dockerfile:1

# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package.json ./
# Note: pnpm-lock.yaml is copied from repo root by deploy script
COPY pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm i

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p tsconfig.json

# Production stage
FROM node:20-slim AS production
WORKDIR /app

# Install system dependencies for YouTube processing
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment for Python packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python packages with caching
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir yt-dlp openai-whisper

# Install PyTorch CPU version separately with correct index
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Copy package files and install ONLY production dependencies
COPY package.json ./
# Note: pnpm-lock.yaml is copied from repo root by deploy script
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm \
    npm i -g pnpm && pnpm i --prod

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
CMD ["node", "dist/worker.js"]
