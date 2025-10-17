FROM oven/bun:1.2.22 AS builder
WORKDIR /app

# Install Node 20 so native postinstall scripts that expect node are satisfied
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gnupg && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs && rm -rf /var/lib/apt/lists/*

# Copy the monorepo and install dependencies
COPY . .
RUN bun install --frozen-lockfile

# Ensure the engine build output directory exists even when the worker is not built
RUN mkdir -p /app/apps/engine/dist

FROM oven/bun:1.2.22 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the prepared workspace
COPY --from=builder /app /app

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
