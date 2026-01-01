FROM oven/bun:1.2.22 AS builder
WORKDIR /app

# Install Node 20 for Next.js optimizations that expect a Node runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gnupg && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs && rm -rf /var/lib/apt/lists/*

COPY . .
RUN bun install --frozen-lockfile

WORKDIR /app/apps/dashboard
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL:-https://app.zeke.ai}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-placeholder}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://api.zeke.ai}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-placeholder}
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Placeholder env vars for build-time validation (real values provided at runtime)
ENV DATABASE_PRIMARY_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV AUTH_SECRET=placeholder-auth-secret-for-build-only
ENV OPENAI_API_KEY=sk-placeholder-for-build-only
ENV API_SECRET_KEY=placeholder-api-secret-key-32chars!
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV PORT=3001
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/bun.lock ./bun.lock
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/dashboard /app/apps/dashboard

WORKDIR /app/apps/dashboard
USER node

EXPOSE 3001
CMD ["node", "/app/node_modules/next/dist/bin/next", "start", "-p", "3001"]
