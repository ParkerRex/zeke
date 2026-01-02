# Engine Application

Content ingestion service with pluggable providers.

## Overview

| Property | Value |
|----------|-------|
| Port | 3010 |
| Framework | Bun HTTP |
| Entry | `apps/engine/src/server/index.ts` |

## Quick Start

```bash
cd apps/engine && bun run start  # Start on port 3010
```

## Purpose

Engine fetches and normalizes content from multiple sources:
- YouTube videos
- RSS/Atom feeds
- Academic papers (arXiv)
- Podcasts (Apple Podcasts)
- Research papers (Semantic Scholar)

## API Endpoints

### POST /ingest

Fetch content from a URL:

```bash
curl -X POST http://localhost:3010/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/watch?v=xxx"}'
```

Response:
```json
{
  "id": "video-id",
  "title": "Video Title",
  "description": "...",
  "sourceType": "youtube",
  "contentType": "video",
  "publishedAt": "2024-01-01T00:00:00Z",
  "duration": 3600,
  "metadata": {
    "channelId": "...",
    "viewCount": 1000
  }
}
```

### POST /source

Get source/channel information:

```bash
curl -X POST http://localhost:3010/source \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/channel/xxx"}'
```

### GET /health

Check provider health:

```bash
curl http://localhost:3010/health
```

## Providers

### YouTube

| Feature | Support |
|---------|---------|
| Video metadata | Yes |
| Channel info | Yes |
| Playlists | Yes |
| Transcripts | Via API |

**Environment Variables:**
```bash
YOUTUBE_API_KEY=AIza...
YOUTUBE_QUOTA_LIMIT=10000
```

### RSS

| Feature | Support |
|---------|---------|
| RSS 2.0 | Yes |
| Atom | Yes |
| Media RSS | Yes |
| CDATA | Yes |

No authentication required.

### arXiv

| Feature | Support |
|---------|---------|
| Paper metadata | Yes |
| Abstracts | Yes |
| Citations | Yes |
| PDF links | Yes |

No authentication required.

### Apple Podcasts

| Feature | Support |
|---------|---------|
| Episode info | Yes |
| Show info | Yes |
| Artwork | Yes |
| Duration | Yes |

Uses iTunes Search API + RSS.

### Semantic Scholar

| Feature | Support |
|---------|---------|
| Paper metadata | Yes |
| Citations | Yes |
| References | Yes |
| Impact metrics | Yes |

Rate limited: 1 request/second.

## Response Format

All providers return normalized data:

```typescript
interface IngestResponse {
  id: string;
  title: string;
  description?: string;
  sourceType: "youtube" | "rss" | "arxiv" | "podcast" | "semantic-scholar";
  contentType: "video" | "article" | "paper" | "podcast";
  publishedAt?: string;
  duration?: number;
  url?: string;
  thumbnailUrl?: string;
  metadata: Record<string, unknown>;
}
```

## Directory Structure

```
apps/engine/src/
├── server/
│   ├── index.ts        # Entry point
│   └── server.ts       # Server setup
├── providers/
│   ├── youtube.ts      # YouTube provider
│   ├── rss.ts          # RSS provider
│   ├── arxiv.ts        # arXiv provider
│   ├── podcast.ts      # Podcast provider
│   └── semantic-scholar.ts
├── common/
│   └── bindings.ts     # Environment types
└── utils/
```

## Adding a Provider

1. Create provider file:

```typescript
// src/providers/new-provider.ts
export class NewProvider implements ContentProvider {
  async ingest(url: string): Promise<IngestResponse> {
    // Fetch and normalize content
  }

  async getSource(url: string): Promise<SourceResponse> {
    // Get source/channel info
  }

  canHandle(url: string): boolean {
    return url.includes("newsite.com");
  }
}
```

2. Register in server:

```typescript
// src/server/server.ts
import { NewProvider } from "../providers/new-provider";

const providers = [
  new YouTubeProvider(),
  new RSSProvider(),
  new NewProvider(), // Add here
];
```

## Error Handling

```typescript
// Provider errors
if (!url) {
  return c.json({ error: "URL required" }, 400);
}

// Provider-specific errors
if (response.status === 429) {
  return c.json({ error: "Rate limited" }, 429);
}
```

## Environment Variables

```bash
# Server
PORT=3010

# YouTube (optional)
YOUTUBE_API_KEY=AIza...
YOUTUBE_QUOTA_LIMIT=10000
YOUTUBE_QUOTA_RESET_HOUR=0

# Security (optional)
API_SECRET_KEY=your-secret-key
```

## Integration with Jobs

Engine is called by pg-boss jobs:

```
pg-boss job
    └── ingest-pull (scheduled)
        └── POST /ingest
            └── YouTube/RSS/etc provider
                └── Normalized response
                    └── Store in database
```

## Related

- [Jobs Package](../packages/jobs.md)
- [Database Package](../packages/database.md)
