FROM oven/bun:1.2.22 AS builder
WORKDIR /app

COPY . .
RUN bun install --frozen-lockfile

FROM oven/bun:1.2.22 AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3010

COPY --from=builder /app /app

WORKDIR /app/apps/engine
EXPOSE 3010
CMD ["bun", "run", "src/server/index.ts"]
