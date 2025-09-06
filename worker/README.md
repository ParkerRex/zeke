# Zeke Worker

Background job processor for Zeke using pg-boss. Handles YouTube video transcription, content processing, and other async tasks.

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

### Job Types

- `transcribe-video`: YouTube video transcription
- `process-content`: Content analysis and processing
- `cleanup-temp-files`: Temporary file cleanup

### Database Schema

- Uses `pgboss` schema for job management
- Worker role with appropriate permissions
- Automatic job partitioning and cleanup

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
