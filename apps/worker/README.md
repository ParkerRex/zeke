# Zeke Worker

Background job processor for Zeke using pg-boss. Handles ingest (RSS/YouTube), extraction (audio → transcript → content), and analysis (LLM overlays/embeddings).

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Local Supabase instance (for development)
- Docker (for containerized development)

### Local Development Setup

1. **Start local Supabase** (from project root):

   ```bash
   pnpm run supabase:start
   ```

2. **Run migrations** (from project root):

   ```bash
   pnpm run migration:up:local
   ```

3. **Test database connection**:

   ```bash
   cd worker
   pnpm run test:connection
   ```

4. **Start worker (Docker, full deps)**:
   ```bash
   bash scripts/deploy-local-worker.sh
   ```

## 🧪 Testing

### Connection Tests

```bash
pnpm run test:connection     # Test database and PgBoss setup
pnpm run test:transcription  # Test job queue functionality
```

### Manual Testing

```bash
# Test YouTube API
node test-youtube-api.js

# Test full pipeline
node test-youtube-pipeline.js
```

## 📦 Deployment

### Production Deployment

```bash
pnpm run deploy:prod
```

### Environment Configuration

#### Local Development (`.env.development`)

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
BOSS_SCHEMA="pgboss"
BOSS_MIGRATE="false"
OPENAI_API_KEY="your-openai-key"
YOUTUBE_API_KEY="your-youtube-key"
```

#### Production (`.env`)

```bash
DATABASE_URL_POOLER="postgresql://worker.xxx:xxx@aws-1-us-central1.pooler.supabase.com:5432/postgres?sslmode=no-verify"
BOSS_SCHEMA="pgboss"
BOSS_MIGRATE="false"
OPENAI_API_KEY="your-openai-key"
YOUTUBE_API_KEY="your-youtube-key"
```

## 🏗️ Architecture

### Queues (pg-boss)

- `system:heartbeat`: periodic heartbeat
- `ingest:pull`: triggers ingest runs (rss, youtube)
- `ingest:fetch-content`: article extraction for raw items
- `ingest:fetch-youtube-content`: YouTube extract → transcribe → content
- `analyze:llm`: overlay + embedding for a story

### Tasks Catalog (worker/src/tasks)

- analyze-story.ts: Generate overlays + embedding for a story (OpenAI or stub), then persist.
- extract-article.ts: Fetch + parse article content, create content/story, enqueue analysis.
- extract-youtube-content.ts: Extract audio → transcribe → VTT → content/story → enqueue analysis.
- fetch-youtube-channel-videos.ts: List channel uploads (via uploads playlist) + details with quota.
- fetch-youtube-search-videos.ts: Search videos + map to domain with quota.
- resolve-youtube-uploads-id.ts: Derive and persist channel uploads playlist ID.
- ingest-rss-source.ts: Fetch → parse → normalize → upsert → enqueue (per RSS source).
- preview-rss-source.ts: Fetch → parse → normalize → preview items (no writes).
- ingest-youtube-source.ts: Orchestrate channel/search ingest, upsert raw items, enqueue extraction.
- preview-youtube-source.ts: Preview channel/search items with current quota status.

Primitives used by these tasks live under `extract/*`, `storage/*`, `transcribe/*`, and are single‑purpose (one function per file) without env/DB/queue access. Third‑party clients live under `lib/*`.

### System Diagrams

RSS Ingest (per source)

```
ingest:pull (rss)
  -> tasks/ingest-rss-source
       fetchWithTimeout(url)
       -> extract/parse-rss-feed
       -> extract/normalize-rss-item (map guid/link/title/date)
       -> extract/build-raw-item-article
       -> db.upsertRawItem
       -> enqueue ingest:fetch-content (article extract)
```

YouTube Ingest (per source)

```
ingest:pull (youtube)
  -> tasks/ingest-youtube-source
       if channel:
         -> tasks/resolve-youtube-uploads-id -> uploadsPlaylistId
         -> tasks/fetch-youtube-channel-videos (quota)
       if search:
         -> tasks/fetch-youtube-search-videos (quota)
       for each video:
         -> extract/build-raw-item-youtube
         -> db.upsertRawItem
         -> enqueue ingest:fetch-youtube-content (extract audio + transcribe)
       -> db.upsertPlatformQuota (quota snapshot)
```

YouTube Extract → Transcribe → Content

```
ingest:fetch-youtube-content
  -> tasks/extract-youtube-content
       -> extract/extract-youtube-audio (yt-dlp)
       -> transcribe/whisper (OpenAI Whisper or local)
       -> storage/generate-vtt-content
       -> storage/prepare-youtube-transcript
       -> db.insertContents + db.insertStory (if new)
       -> enqueue analyze:llm
```

Analyze Story

```
analyze:llm
  -> tasks/analyze-story
       (OpenAI or stub)
       -> db.upsertStoryOverlay
       -> db.upsertStoryEmbedding
```

### Docker Images

- **Development**: Fast build without Python dependencies
- **Production**: Full build with PyTorch, Whisper, yt-dlp

## 🔧 Scripts Reference

| Script                                | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `bash scripts/deploy-local-worker.sh` | Start worker in Docker (yt-dlp/ffmpeg/Whisper) |
| `pnpm run build`                      | Build TypeScript                               |
| `pnpm run start`                      | Start production server                        |
| `pnpm run test:connection`            | Test database connectivity                     |
| `pnpm run test:transcription`         | Test job queue                                 |
| `pnpm run deploy:prod`                | Deploy to GCP Cloud Run                        |
| `pnpm run logs`                       | View production logs                           |
| `pnpm run logs:errors`                | View error logs only                           |

## 🔌 HTTP Debug Endpoints

- `GET /healthz` — healthcheck
- `GET /debug/status` — quick status snapshot (sources/raw/contents/jobs)
- `GET /debug/preview-source?sourceId=...&limit=...` — preview items (rss/youtube)
- `POST /debug/ingest-now` — run ingest for all RSS sources now
- `POST /debug/ingest-youtube` — run ingest for all YouTube sources now
- `POST /debug/ingest-source?sourceId=...` — run ingest for one source (rss/youtube)
## 🐛 Troubleshooting

### Common Issues

1. **SSL Connection Errors**

   - Local: Use `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
   - Production: Ensure `sslmode=no-verify` in connection string

2. **PgBoss Schema Missing**

   ```bash
   pnpm run migration:up:local  # Apply migrations
   ```

3. **Worker Role Missing**

   - Migration automatically creates worker role for local development
   - Production requires manual role setup

4. **Build Timeouts**
   - Use development Dockerfile for faster iteration
   - Production builds take 8-10 minutes due to Python dependencies

### Performance Optimization

- **Local Development**: 23 seconds build time
- **Production**: 8-10 minutes with optimizations
- **Regional Matching**: Ensure worker and database in same region

## 📊 Monitoring

### Health Checks

- Worker exposes health endpoint on `/health`
- PgBoss connection status monitoring
- Job processing metrics

### Logging

- Structured JSON logging
- Error tracking with context
- Performance metrics collection
