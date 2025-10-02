# Engine Agent Preferences

## Coding Preferences
- Treat `apps/engine` as a Cloudflare Worker first: keep handlers stateless, favor pure helpers, and rely on typed bindings instead of `process.env` inside the runtime.
- Use Hono with `zod` schemas for route validation; keep schema definitions colocated with route handlers.
- Go through the `Provider` facade from routes; add providers by mirroring the `*-api.ts`, `*-provider.ts`, `transform.ts`, `types.ts` pattern already in the tree.
- Translate external payloads inside `transform.ts` files, keep HTTP wiring inside `*-api.ts`; each provider must implement the `ProviderInterface` contract.
- All providers must implement: `getContent()`, `getSource()`, `getHealthCheck()`, and `supportsUrl()` methods.
- Normalize errors with consistent error responses; emit clear error messages so API consumers can handle failures gracefully.
- Stick to strict TypeScript: explicit return types, narrow unions, and avoid `any`; cast sparingly.
- Test shell scripts are provided for each provider (`test-youtube.sh`, `test-rss.sh`, etc.); use these for validation.
- Keep secrets in `.dev.vars` for local development; use `wrangler secret put` for production deployment.
- When adding new providers, update `src/providers/index.ts` to register them in the facade.

## Layout Guide
```
apps/engine/                              # Cloudflare Worker that ingests content from multiple research sources
├── .dev.vars-example                    # Sample wrangler dev vars for local worker runs
├── .gitignore                           # Ignore rules for the engine workspace
├── README.md                            # Comprehensive docs for content ingestion service
├── AGENTS.md                            # Preferred practices and layout guide for agents
├── package.json                         # Bun package config, scripts, and dependency manifest
├── test-youtube.sh                      # Shell script to test YouTube provider
├── test-rss.sh                          # Shell script to test RSS provider
├── test-arxiv.sh                        # Shell script to test arXiv provider
├── test-podcast.sh                      # Shell script to test Apple Podcasts provider
├── test-semantic-scholar.sh             # Shell script to test Semantic Scholar provider
├── tsconfig.json                        # Base TS config with Cloudflare Worker types
├── wrangler.toml                        # Cloudflare Worker deployment config
└── src/                                 # Engine runtime source: Hono app, routes, providers
    ├── index.ts                         # Bootstraps Hono app, wires routes (ingest, source, health)
    ├── common/
    │   └── bindings.ts                  # Typed Cloudflare bindings (env vars, secrets)
    └── providers/                       # Provider facade plus per-provider implementations
        ├── index.ts                     # Provider aggregator that routes URLs to concrete providers
        ├── interface.ts                 # Contract that all provider classes must satisfy
        ├── types.ts                     # Shared types: ContentItem, ContentSource, HealthStatus, etc.
        ├── youtube/
        │   ├── youtube-api.ts           # YouTube Data API v3 client
        │   ├── youtube-provider.ts      # YouTube implementation of ProviderInterface
        │   └── transform.ts             # Normalizes YouTube API responses to ContentItem format
        ├── rss/
        │   ├── rss-api.ts               # RSS/Atom feed parser
        │   ├── rss-provider.ts          # RSS implementation of ProviderInterface
        │   └── transform.ts             # Normalizes RSS feed data to ContentItem format
        ├── arxiv/
        │   ├── arxiv-api.ts             # arXiv API client
        │   ├── arxiv-provider.ts        # arXiv implementation of ProviderInterface
        │   └── transform.ts             # Normalizes arXiv paper data to ContentItem format
        ├── apple-podcasts/
        │   ├── apple-podcasts-api.ts    # iTunes Search API + RSS feed parser
        │   ├── apple-podcasts-provider.ts # Apple Podcasts implementation of ProviderInterface
        │   └── transform.ts             # Normalizes podcast episode data to ContentItem format
        └── semantic-scholar/
            ├── semantic-scholar-api.ts  # Semantic Scholar Graph API client
            ├── semantic-scholar-provider.ts # Semantic Scholar implementation of ProviderInterface
            └── transform.ts             # Normalizes paper data to ContentItem format
```

## Provider Pattern

Each provider implements this interface:

```typescript
interface ProviderInterface {
  getContent(url: string): Promise<ContentItem>;
  getSource(url: string): Promise<ContentSource>;
  getHealthCheck(): Promise<HealthStatus>;
  supportsUrl(url: string): boolean;
}
```

## Data Flow

```
User URL → Provider Facade (routes by domain) → Specific Provider → API Client → Transform → Normalized ContentItem
```

## API Endpoints

- `POST /ingest` - Fetch and normalize content from any supported URL
- `POST /source` - Get source/channel information from a URL
- `GET /health` - Check health status of all providers

## Supported Content Types

- **Videos** (🎥): YouTube
- **Articles** (📰): RSS/Atom feeds
- **Papers** (📚): arXiv, Semantic Scholar
- **Podcasts** (🎙️): Apple Podcasts
- **Feeds** (📡): RSS

## Adding New Providers

Follow this pattern:
1. Create `src/providers/<name>/<name>-api.ts` - API client
2. Create `src/providers/<name>/<name>-provider.ts` - Provider implementation
3. Create `src/providers/<name>/transform.ts` - Data normalization
4. Create `src/providers/<name>/types.ts` - API response types (if needed)
5. Add provider to `src/providers/types.ts` source types
6. Register in `src/providers/index.ts` facade
7. Create `test-<name>.sh` shell script for testing
