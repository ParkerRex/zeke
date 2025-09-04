# syntax=docker/dockerfile:1
FROM node:20-slim
WORKDIR /app

# System deps (if you later add yt-dlp/ffmpeg, add here)
# RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Install dependencies (include dev deps to build TypeScript)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i; \
    elif [ -f yarn.lock ]; then yarn install; \
    else npm i; fi

COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npx tsc -p tsconfig.json

# Optionally prune dev dependencies to slim image
RUN if [ -f package-lock.json ]; then npm prune --omit=dev; \
    elif [ -f pnpm-lock.yaml ]; then pnpm prune --prod; \
    elif [ -f yarn.lock ]; then yarn workspaces focus --production || true; fi

ENV NODE_ENV=production
CMD ["node", "dist/worker.js"]
