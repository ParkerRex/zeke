# ZEKE Worker Architecture Guide

## 🎯 Overview

The ZEKE Worker is responsible for:
- **Ingesting** news from RSS feeds and YouTube channels
- **Extracting** content from articles and videos  
- **Analyzing** content with AI/LLM processing
- **Managing** the entire pipeline through job queues

This guide explains the **new modular architecture** that makes the system easier to understand and maintain.

## 🏗️ Architecture Principles

### Before (Confusing)
- ❌ One giant 797-line file with everything mixed together
- ❌ HTTP endpoints and job processing in the same place
- ❌ Duplicate code paths for manual vs scheduled jobs
- ❌ Hard to understand what does what

### After (Clear)
- ✅ **Single Responsibility**: Each module does one thing well
- ✅ **Consistent Patterns**: All jobs triggered the same way
- ✅ **Clear Separation**: HTTP, jobs, and business logic separated
- ✅ **Beginner Friendly**: Easy to find and understand code

## 📁 New File Structure

```
src/
├── worker.ts                  # 🚀 Main entry point (30 lines - new modular architecture)
├── core/                      # 🧠 Core business logic
│   ├── worker-service.ts      # Main service coordinator
│   ├── job-orchestrator.ts    # Consistent job triggering
│   └── job-definitions.ts     # All job configurations
├── http/                      # 🌐 HTTP endpoints
│   └── routes.ts              # All API routes
├── tasks/                     # 📋 Business logic (unchanged)
│   ├── ingest-rss-source.ts
│   ├── extract-article.ts
│   └── ...
├── worker-old.ts              # 🔄 Legacy architecture (backup)
└── [other existing files]     # 🔧 Utilities, DB, etc.
```

## 🔄 How Jobs Work Now

### The Old Confusing Way
```
Frontend → API → HTTP Endpoint → Direct Function Call
                              ↓
Scheduled Job → Queue → Worker → Same Function (duplicated!)
```

### The New Clear Way  
```
Frontend → API → Job Orchestrator → Queue → Worker → Task Function
Scheduler → Job Orchestrator → Queue → Worker → Task Function
```

**Key Insight**: Everything goes through the **Job Orchestrator** now. No more duplicate code paths!

## 🎮 Job Orchestrator

The **Job Orchestrator** (`core/job-orchestrator.ts`) is the central hub that eliminates confusion:

```typescript
// ✅ Clean: All job triggering goes through orchestrator
await orchestrator.triggerRssIngest();           // Manual trigger
await orchestrator.triggerYouTubeIngest();       // Manual trigger  
await orchestrator.triggerStoryAnalysis(id);     // Analysis trigger

// ❌ Old way: Direct function calls mixed with queue sends
await ingestRssSource(boss, src);                // Direct call
await boss.send("ingest:pull", data);            // Queue send
```

### Available Operations
- `triggerRssIngest()` - Ingest all RSS sources
- `triggerYouTubeIngest()` - Ingest all YouTube sources
- `triggerRssSourceIngest(id)` - Ingest specific RSS source
- `triggerYouTubeSourceIngest(id)` - Ingest specific YouTube source
- `triggerContentExtraction(ids)` - Extract article content
- `triggerYouTubeContentExtraction(data)` - Extract video content
- `triggerStoryAnalysis(id)` - Analyze story with AI
- `triggerOneOffIngest(urls)` - Process arbitrary URLs

## 🔧 Job Definitions

All job configurations live in `core/job-definitions.ts`:

```typescript
// Queue names (type-safe)
export const QUEUES = {
  SYSTEM_HEARTBEAT: "system:heartbeat",
  INGEST_PULL: "ingest:pull", 
  INGEST_FETCH_CONTENT: "ingest:fetch-content",
  // ... etc
} as const;

// Job data types (for safety)
export interface IngestPullJobData {
  source: "rss" | "youtube";
}

// Setup functions
await createJobQueues(boss);        // Create all queues
await scheduleRecurringJobs(boss);  // Set up cron schedules  
await setupJobWorkers(boss, orch);  // Start all workers
```

## 🌐 HTTP Routes

All HTTP endpoints are in `http/routes.ts` and follow consistent patterns:

```typescript
// Health checks
GET  /healthz              # Simple health check
GET  /debug/status         # Detailed system status

// Manual job triggers (admin only)
POST /debug/ingest-now     # Trigger RSS ingest
POST /debug/ingest-youtube # Trigger YouTube ingest
POST /debug/ingest-source  # Trigger specific source
POST /debug/ingest-oneoff  # Process arbitrary URLs

// Source testing
GET  /debug/preview-source # Preview source content
```

**Key Point**: HTTP endpoints only call the orchestrator. No business logic in routes!

## 🚀 Getting Started

### 1. Understanding the Flow

1. **Entry Point**: `worker-new.ts` starts everything
2. **Service**: `worker-service.ts` coordinates all components
3. **Jobs**: `job-definitions.ts` defines what work gets done
4. **Orchestrator**: `job-orchestrator.ts` triggers work consistently
5. **Routes**: `routes.ts` handles HTTP requests
6. **Tasks**: `tasks/` contains the actual business logic

### 2. Adding a New Job

```typescript
// 1. Add queue name to job-definitions.ts
export const QUEUES = {
  // ... existing queues
  MY_NEW_QUEUE: "my:new-queue",
} as const;

// 2. Add job data type
export interface MyJobData {
  someId: string;
  options?: Record<string, unknown>;
}

// 3. Add queue creation
await boss.createQueue(QUEUES.MY_NEW_QUEUE);

// 4. Add worker
await boss.work(QUEUES.MY_NEW_QUEUE, async (jobs) => {
  for (const job of jobs) {
    await processMyJob(boss, job);
  }
});

// 5. Add orchestrator method
async triggerMyJob(data: MyJobData): Promise<void> {
  await boss.send(QUEUES.MY_NEW_QUEUE, data);
}

// 6. Add HTTP endpoint (if needed)
app.post("/debug/my-job", async (req, res) => {
  await orchestrator.triggerMyJob(req.body);
  res.json({ ok: true });
});
```

### 3. Common Patterns

**Error Handling**:
```typescript
try {
  await doWork(job.data);
  await boss.complete(QUEUE_NAME, job.id);
} catch (err) {
  await boss.fail(QUEUE_NAME, job.id, { error: String(err) });
}
```

**Logging**:
```typescript
log("job_start", { jobId: job.id, type: "my_job" });
// ... do work
log("job_done", { jobId: job.id, result: "success" });
```

**Type Safety**:
```typescript
const { someId } = (job.data as MyJobData) || {};
if (!someId) {
  throw new Error("Missing someId in job data");
}
```

## 🔍 Debugging

### Check System Status
```bash
curl http://localhost:8080/debug/status
```

### Trigger Jobs Manually
```bash
# RSS ingest
curl -X POST http://localhost:8080/debug/ingest-now

# YouTube ingest  
curl -X POST http://localhost:8080/debug/ingest-youtube

# Specific source
curl -X POST "http://localhost:8080/debug/ingest-source?sourceId=123"
```

### Monitor Logs
```bash
# In development
pnpm run dev

# Check logs
pnpm run logs
```

## 🎯 Benefits of New Architecture

1. **Easier to Learn**: Each file has a clear, single purpose
2. **Easier to Debug**: Consistent patterns and clear data flow
3. **Easier to Extend**: Add new jobs following established patterns
4. **Easier to Test**: Isolated components can be tested independently
5. **Easier to Maintain**: Changes are localized to specific modules

## ✅ Migration Complete

The new modular architecture is now the primary implementation:

1. **✅ New architecture active**: `worker.ts` now uses the modular system
2. **✅ Legacy preserved**: `worker-old.ts` contains the original monolithic system
3. **✅ Scripts updated**: All npm scripts use the new architecture by default
4. **✅ Backward compatibility**: Use `:old` suffix to access legacy system

The migration maintains 100% functional compatibility while providing a much clearer and easier to work with codebase.

## 📚 Quick Reference

### File Purposes
- `worker.ts` - 🚀 **Start here**: Simple entry point (new modular architecture)
- `core/worker-service.ts` - 🎛️ **Coordinator**: Manages everything
- `core/job-orchestrator.ts` - 🎯 **Trigger**: Consistent job starting
- `core/job-definitions.ts` - 📋 **Config**: All job setup
- `http/routes.ts` - 🌐 **API**: All HTTP endpoints
- `tasks/*.ts` - 🔧 **Work**: Actual business logic
- `worker-old.ts` - 🔄 **Legacy**: Original monolithic system (backup)

### Common Commands
```bash
# Development (new architecture - default)
pnpm run dev                    # Start with modular architecture
pnpm run dev:old               # Start with legacy architecture

# Testing
pnpm run test:unit             # Unit tests for core modules
pnpm run test:integration      # End-to-end pipeline tests

# Manual triggers
curl -X POST localhost:8080/debug/ingest-now
curl -X POST localhost:8080/debug/ingest-youtube

# Status check
curl localhost:8080/debug/status
curl localhost:8080/healthz
```
