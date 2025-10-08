# syntax=docker/dockerfile:1.7

FROM oven/bun:1.2.22 AS base
WORKDIR /app

FROM base AS turbo
RUN bun add -g turbo

FROM turbo AS prune
WORKDIR /app
COPY . .
RUN turbo prune @zeke/engine --docker

FROM base AS deps
WORKDIR /app
COPY --from=prune /app/out/json/ ./
RUN bun install

FROM deps AS builder
WORKDIR /app
COPY --from=prune /app/out/full/ ./
RUN bun install

FROM oven/bun:1.2.22 AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3010

COPY --from=builder /app /app

WORKDIR /app/apps/engine
EXPOSE 3010
CMD ["bun", "run", "src/server/index.ts"]
