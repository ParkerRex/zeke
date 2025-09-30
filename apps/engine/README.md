# Zeke Engine - Content Ingestion Service

A Cloudflare Worker that fetches and normalizes content from multiple research sources.

## 🎯 What It Does

The engine is Zeke's "content plumber" - it connects to YouTube, RSS feeds, arXiv, Apple Podcasts, and Semantic Scholar to fetch raw content and normalize it into a consistent format for downstream AI processing.

Think of it as **"Plaid for research content"** - a unified API over multiple content providers.

**Now supports 5 content types:** 🎥 Videos • 📰 Articles • 📚 Papers • 🎙️ Podcasts • 📡 Feeds

---

## 🚀 Quick Start

### Prerequisites
- Bun installed
- YouTube Data API v3 key ([get one here](https://console.cloud.google.com/apis/credentials))

### Local Development

```bash
# Install dependencies
bun install

# Set up environment
cp .dev.vars-example .dev.vars
# Add your YOUTUBE_API_KEY to .dev.vars

# Start the dev server
bun run dev
# Engine runs on http://localhost:8787
```

### Test All Providers

```bash
# Test individually
./test-youtube.sh            # YouTube videos
./test-rss.sh                # RSS feeds
./test-arxiv.sh              # Academic papers
./test-podcast.sh            # Apple Podcasts
./test-semantic-scholar.sh   # Research papers
```

---

## 📡 API Endpoints

### `POST /ingest`
Fetch content from any supported URL

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "description": "...",
    "sourceType": "youtube",
    "contentType": "video",
    "publishedAt": "2009-10-25T06:57:33Z",
    "duration": 213,
    "metadata": {
      "videoId": "dQw4w9WgXcQ",
      "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
      "viewCount": 1400000000,
      "thumbnail": "https://..."
    }
  }
}
```

### `POST /source`
Get source/channel information

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "data": {
    "id": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "name": "Rick Astley",
    "description": "...",
    "sourceType": "youtube",
    "metadata": {
      "subscriberCount": 3500000,
      "videoCount": 60
    }
  }
}
```

### `GET /health`
Check provider health

**Response:**
```json
{
  "status": "healthy",
  "providers": {
    "youtube": { "status": "healthy", "message": "YouTube Data API is accessible" },
    "rss": { "status": "healthy", "message": "RSS parsing operational" },
    "arxiv": { "status": "healthy", "message": "arXiv API is accessible" },
    "podcast": { "status": "healthy", "message": "Apple Podcasts API is accessible" },
    "semantic-scholar": { "status": "healthy", "message": "Semantic Scholar API is accessible" }
  },
  "timestamp": "2025-09-30T..."
}
```

---

## 🔌 Supported Providers

### 🎥 YouTube
- **API**: YouTube Data API v3
- **Auth**: Requires API key
- **Content**: Videos, channels, playlists
- **Metadata**: Views, likes, comments, channel info, duration
- **Quota**: 10,000 units/day (1 unit per video fetch)

**Supported URLs:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

### 📰 RSS
- **API**: Standard RSS/Atom feeds
- **Auth**: None required
- **Content**: Articles, blog posts, news
- **Metadata**: Feed title, author, publish date
- **Features**: CDATA parsing, HTML stripping, entity decoding

**Supported URLs:**
- Any URL containing `/rss`, `/feed`, `/atom`, `.xml`
- Known feed domains (`hnrss.org`, `feeds.*`)
- Blog and news sites (auto-detection)

### 📚 arXiv
- **API**: arXiv API (open access)
- **Auth**: None required
- **Content**: Academic papers (preprints)
- **Metadata**: Authors, categories, DOI, journal references, abstracts
- **Coverage**: Physics, Math, CS, Biology, Finance

**Supported URLs:**
- `https://arxiv.org/abs/PAPER_ID`
- `https://arxiv.org/pdf/PAPER_ID.pdf`

### 🎙️ Apple Podcasts
- **API**: iTunes Search API + RSS
- **Auth**: None required
- **Content**: Podcast episodes
- **Metadata**: Episode duration, show info, artwork, genres
- **Features**: Extracts latest episode from podcast feed

**Supported URLs:**
- `https://podcasts.apple.com/us/podcast/PODCAST_NAME/idPODCAST_ID`
- `https://podcasts.apple.com/podcast/idPODCAST_ID`

### 📖 Semantic Scholar
- **API**: Semantic Scholar Graph API
- **Auth**: None required (rate limited)
- **Content**: Academic papers (200M+ papers)
- **Metadata**: Citations, references, fields of study, impact metrics
- **Features**: Open access PDFs, DOI/ArXiv cross-references

**Supported URLs:**
- `https://www.semanticscholar.org/paper/PAPER_ID`
- DOI URLs (auto-detected)
- ArXiv URLs (cross-referenced)

**Note**: Free tier has strict rate limits. Consider applying for API key for production use.

---

## 🏗️ Architecture

```
apps/engine/
├── src/
│   ├── index.ts              # Hono app + routes
│   ├── providers/
│   │   ├── index.ts          # Provider facade (routing)
│   │   ├── interface.ts      # Provider contract
│   │   ├── types.ts          # Shared types
│   │   ├── youtube/
│   │   │   ├── youtube-api.ts       # YouTube Data API client
│   │   │   ├── youtube-provider.ts  # Provider implementation
│   │   │   └── transform.ts         # Data normalization
│   │   ├── rss/
│   │   │   ├── rss-api.ts           # RSS parser
│   │   │   ├── rss-provider.ts      # Provider implementation
│   │   │   └── transform.ts         # Data normalization
│   │   ├── arXiv/
│   │   │   ├── arxiv-api.ts         # arXiv API client
│   │   │   ├── arxiv-provider.ts    # Provider implementation
│   │   │   └── transform.ts         # Data normalization
│   │   ├── apple-podcasts/
│   │   │   ├── apple-podcasts-api.ts  # iTunes Search API + RSS
│   │   │   ├── apple-podcasts-provider.ts
│   │   │   └── transform.ts
│   │   └── semantic-scholar/
│   │       ├── semantic-scholar-api.ts  # Graph API client
│   │       ├── semantic-scholar-provider.ts
│   │       └── transform.ts
│   └── common/
│       └── bindings.ts       # Cloudflare Worker bindings
└── wrangler.toml             # Cloudflare config
```

### Provider Pattern

Each provider follows the same interface:

```typescript
interface ProviderInterface {
  getContent(url: string): Promise<ContentItem>;
  getSource(url: string): Promise<ContentSource>;
  getHealthCheck(): Promise<HealthStatus>;
  supportsUrl(url: string): boolean;
}
```

### Data Flow

```
User URL → Provider Facade → Specific Provider → API Client → Transform → Normalized Output
```

---

## 🧪 Testing

```bash
# Start engine
bun run dev

# Test YouTube
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' | jq '.'

# Test RSS
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://hnrss.org/newest?points=100"}' | jq '.'

# Test arXiv
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://arxiv.org/abs/2103.00020"}' | jq '.'

# Test Apple Podcasts
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://podcasts.apple.com/us/podcast/lex-fridman-podcast/id1434243584"}' | jq '.'

# Test Semantic Scholar
curl -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.semanticscholar.org/paper/204e3073870fae3d05bcbc2f6a8e263d9b72e776"}' | jq '.'

# Health check
curl http://localhost:8787/health | jq '.'
```

---

## 📦 Deployment

### Cloudflare Workers

```bash
# Deploy to production
wrangler deploy

# Deploy to staging
wrangler deploy --env staging
```

### Required Secrets

```bash
# Set YouTube API key
wrangler secret put YOUTUBE_API_KEY

# Set API secret (for authentication)
wrangler secret put API_SECRET_KEY
```

---

## 🔮 Adding New Providers

Want to add more providers? Follow this pattern:

1. Create `src/providers/<name>/<name>-api.ts` - API client
2. Create `src/providers/<name>/<name>-provider.ts` - Provider implementation
3. Create `src/providers/<name>/transform.ts` - Data normalization
4. Create `src/providers/<name>/types.ts` - API response types
5. Add provider type to `src/providers/types.ts`
6. Register in `src/providers/index.ts` facade

**Potential additions:**
- Twitter/X (posts, threads)
- Medium (articles)
- Substack (newsletters)
- Spotify (podcasts, shows)
- GitHub (repos, discussions)
- PubMed (biomedical papers)
- SSRN (social science papers)

---

## 🐛 Troubleshooting

### "YouTube API error: 403"
- Check your API key in `.dev.vars`
- Verify quota limits in Google Cloud Console
- Make sure YouTube Data API v3 is enabled

### "No provider found for URL"
- Check URL format
- Verify provider supports that domain
- Check `supportsUrl()` logic in provider

### "RSS feed returned no items"
- Verify feed URL is valid RSS/Atom
- Check if feed requires authentication
- Test feed URL in browser first

### "Semantic Scholar rate limit"
- Free tier: 1 request/second, 100 requests/5 minutes
- Wait before retrying
- Consider applying for API key: https://www.semanticscholar.org/product/api#api-key-form

### "Podcast not found"
- Verify podcast ID is correct
- Check if podcast is available in your region
- Some podcasts may not have RSS feeds available

---

## 📚 Resources

- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [arXiv API Docs](https://arxiv.org/help/api/)
- [RSS Specification](https://www.rssboard.org/rss-specification)
- [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)
- [Semantic Scholar API](https://api.semanticscholar.org/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

---

## 📊 Provider Comparison

| Feature | YouTube | RSS | arXiv | Apple Podcasts | Semantic Scholar |
|---------|---------|-----|-------|----------------|------------------|
| **API Key Required** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No* |
| **Rate Limit** | 10K units/day | None | 3 req/sec | None | 1 req/sec* |
| **Content Type** | Video | Article | Paper | Audio | Paper |
| **Metadata Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Coverage** | Billions | Unlimited | 2M+ papers | Millions | 200M+ papers |
| **Best For** | Video tutorials | News/blogs | Preprints | Podcasts | Citation analysis |

\* Semantic Scholar free tier is limited. API key available for higher limits.

---

**Built with ❤️ for Zeke - Turn 10 Hours of Research into 5 Minutes of Insights**