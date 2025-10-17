FROM oven/bun:1.2.22 AS builder
WORKDIR /app

# Install Node 20 for Next.js build optimizations
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gnupg && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs && rm -rf /var/lib/apt/lists/*

COPY . .
RUN bun install --frozen-lockfile

WORKDIR /app/apps/website
ENV NEXT_PUBLIC_SUPABASE_URL=https://hblelrtwdpukaymtpchv.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibGVscnR3ZHB1a2F5bXRwY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Njg1MDMsImV4cCI6MjA3MjQ0NDUwM30.PooTgnM30B30on2FBbdri2_eKqIZoR3YZb8i-jtKdjo
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NEXT_PUBLIC_SUPABASE_URL=https://hblelrtwdpukaymtpchv.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibGVscnR3ZHB1a2F5bXRwY2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Njg1MDMsImV4cCI6MjA3MjQ0NDUwM30.PooTgnM30B30on2FBbdri2_eKqIZoR3YZb8i-jtKdjo
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV PORT=3000

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/bun.lock ./bun.lock
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/website /app/apps/website

WORKDIR /app/apps/website
USER node

EXPOSE 3000
CMD ["node", "/app/node_modules/next/dist/bin/next", "start", "-p", "3000"]
