# ZEKE Worker - Beginner's Guide

## 🎯 What is the Worker?

The ZEKE Worker is a background service that:
1. **Fetches** news from RSS feeds and YouTube channels
2. **Extracts** content from articles and videos
3. **Analyzes** content using AI (OpenAI)
4. **Stores** everything in the database

Think of it as a robot that continuously reads the internet and summarizes what it finds.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (via Supabase)
- OpenAI API key
- YouTube API key (optional)

### Environment Setup
Create `apps/worker/.env.development`:
```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
OPENAI_API_KEY="your-openai-key"
YOUTUBE_API_KEY="your-youtube-key"
```

### Run the Worker
```bash
# Navigate to worker directory
cd apps/worker

# Install dependencies
pnpm install

# Start in development mode
pnpm run dev
```

The worker will start on `http://localhost:8080` and begin processing jobs automatically.

## 🏗️ How It Works (Simple Explanation)

### 1. The Big Picture
```
RSS Feeds → Worker → Database → Main App → Users
YouTube   ↗        ↘ AI Analysis
```

### 2. The Job Pipeline
```
1. INGEST: Find new articles/videos
2. EXTRACT: Get the full content  
3. ANALYZE: Use AI to understand it
4. STORE: Save to database
```

### 3. Example Flow
1. Worker checks BBC RSS feed
2. Finds new article: "Breaking: Major News Event"
3. Downloads full article content
4. Sends to OpenAI: "Summarize this article"
5. Stores article + AI summary in database
6. Main app shows it to users

## 📁 Code Organization (New & Improved!)

The worker used to be one giant confusing file. Now it's organized clearly:

```
src/
├── worker.ts                  # 🚀 START HERE: Main entry point (new architecture)
├── core/                      # 🧠 Core logic
│   ├── worker-service.ts      # Coordinates everything
│   ├── job-orchestrator.ts    # Triggers jobs consistently
│   └── job-definitions.ts     # Defines all jobs
├── http/                      # 🌐 Web endpoints
│   └── routes.ts              # API routes for manual triggers
├── tasks/                     # 📋 Actual work functions
│   ├── ingest-rss-source.ts   # Fetch RSS feeds
│   ├── extract-article.ts     # Extract article content
│   ├── analyze-story.ts       # AI analysis
│   └── ...
├── worker-old.ts              # 🔄 Legacy system (backup)
├── db.ts                      # 🗄️ Database functions
├── log.ts                     # 📝 Logging
└── utils/                     # 🔧 Helper functions
```

## 🎮 Understanding Jobs

### What are Jobs?
Jobs are units of work that the worker processes. Examples:
- "Ingest all RSS sources" 
- "Extract content from article #123"
- "Analyze story #456 with AI"

### Job Types
1. **Scheduled Jobs**: Run automatically (every 5 minutes for RSS)
2. **Manual Jobs**: Triggered by API calls or admin actions
3. **Chained Jobs**: One job creates another (ingest → extract → analyze)

### Job Flow Example
```
RSS Ingest Job
├── Finds 5 new articles
├── Creates 5 "Extract Content" jobs
└── Each extract job creates 1 "Analyze Story" job
```

## 🔧 Common Tasks

### Check if Worker is Running
```bash
curl http://localhost:8080/healthz
# Should return: ok
```

### See System Status
```bash
curl http://localhost:8080/debug/status
# Shows: sources, jobs, database counts
```

### Manually Trigger Jobs
```bash
# Trigger RSS ingest
curl -X POST http://localhost:8080/debug/ingest-now

# Trigger YouTube ingest
curl -X POST http://localhost:8080/debug/ingest-youtube

# Process a specific source
curl -X POST "http://localhost:8080/debug/ingest-source?sourceId=abc123"

# Process arbitrary URLs
curl -X POST http://localhost:8080/debug/ingest-oneoff \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com/article"]}'
```

### View Logs
```bash
# In development (shows live logs)
pnpm run dev

# View recent logs
pnpm run logs

# View only errors
pnpm run logs:errors
```

## 🐛 Debugging

### Common Issues

**Worker won't start**:
- Check `DATABASE_URL` is correct
- Ensure database is running
- Verify environment variables

**Jobs not processing**:
- Check `/debug/status` for job counts
- Look for error logs
- Verify API keys are valid

**No new content**:
- Check if sources are configured in database
- Verify RSS feeds are accessible
- Check quota limits for YouTube

### Debug Commands
```bash
# Check database connection
pnpm run test:connection

# Test specific functionality
pnpm run test:transcription

# View detailed logs
pnpm run logs
```

## 🎯 For Beginners: Where to Start

### 1. Understand the Entry Point
Start with `src/worker.ts` - it's only 30 lines and shows how everything starts with the new modular architecture.

### 2. Follow a Simple Job
Look at `src/tasks/ingest-rss-source.ts` to see how RSS ingestion works:
1. Fetch RSS feed
2. Parse XML
3. Extract articles
4. Queue content extraction jobs

### 3. Understand the Orchestrator
Check `src/core/job-orchestrator.ts` to see how all jobs are triggered consistently.

### 4. Explore HTTP Routes
Look at `src/http/routes.ts` to see how manual triggers work.

### 5. Add Your Own Job
Follow the patterns in `job-definitions.ts` to add new functionality.

## 📚 Key Concepts

### pg-boss
- **What**: PostgreSQL-based job queue
- **Why**: Reliable, persistent job processing
- **How**: Jobs stored in database, workers poll for work

### Job Orchestrator
- **What**: Central hub for triggering jobs
- **Why**: Eliminates duplicate code paths
- **How**: All job triggers go through one consistent interface

### Type Safety
- **What**: TypeScript types for all job data
- **Why**: Prevents runtime errors
- **How**: Interfaces define job payload structure

## 🎉 Success Indicators

You know the worker is working when:
- ✅ `/healthz` returns "ok"
- ✅ `/debug/status` shows job activity
- ✅ New articles appear in the main app
- ✅ Logs show successful job completion
- ✅ Database has new content entries

## 🆘 Getting Help

1. **Check logs first**: Most issues show up in logs
2. **Use debug endpoints**: `/debug/status` shows system state
3. **Test manually**: Use curl commands to trigger jobs
4. **Read the code**: Start with `worker-new.ts` and follow the flow
5. **Ask for help**: The architecture is now much clearer to explain!

Remember: The new architecture makes everything easier to understand. Each file has a clear purpose, and the flow is consistent throughout.
