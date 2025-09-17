# YouTube Processing Deployment Strategy

## 🎯 **Current Status: Core RSS Deployment First**

Due to Railway's build timeout limitations with large Python ML dependencies (yt-dlp, Whisper, PyTorch), we're implementing a phased deployment approach:

### Phase 1: Core RSS Processing ✅ **READY NOW**
- **Lightweight Docker image** (~200MB vs ~2GB with YouTube deps)
- **Fast deployment** (~2-3 minutes vs 50+ minutes timeout)
- **Core functionality**: RSS ingestion, content extraction, LLM analysis
- **YouTube processing**: Gracefully skipped when `YOUTUBE_API_KEY` not provided

### Phase 2: YouTube Processing (Future)
- **Separate service** or **different deployment platform**
- **Full ML dependencies**: yt-dlp, OpenAI Whisper, PyTorch
- **Video transcription** and **audio extraction**

## 🚀 **Immediate Deployment: Core RSS Worker**

### What Works Now
✅ **RSS Feed Ingestion**: Full RSS processing pipeline  
✅ **Content Extraction**: Article text extraction and processing  
✅ **LLM Analysis**: OpenAI/Anthropic content analysis  
✅ **Job Processing**: pg-boss queue management  
✅ **Health Monitoring**: Health checks and status endpoints  
✅ **Database Integration**: Full Supabase connectivity with worker permissions  

### What's Gracefully Skipped
⚠️ **YouTube Channel Ingestion**: Skipped if `YOUTUBE_API_KEY` not set  
⚠️ **YouTube Video Processing**: Skipped if dependencies not available  
⚠️ **Audio Transcription**: Skipped if Whisper not installed  

### Code Behavior
The worker is already designed to handle missing YouTube functionality gracefully:

```typescript
// From job-definitions.ts
async function handleYouTubeIngest(boss: PgBoss): Promise<void> {
  if (!process.env.YOUTUBE_API_KEY) {
    log('ingest_youtube_skipped', { reason: 'missing_api_key' }, 'warn');
    return; // Gracefully skip YouTube processing
  }
  // YouTube processing code...
}
```

## 📋 **Deployment Instructions**

### 1. Deploy Core RSS Worker to Railway

```bash
cd apps/worker

# Deploy with lightweight Dockerfile (no YouTube deps)
railway up
```

**Expected Result:**
- ✅ Fast build (~2-3 minutes)
- ✅ Small image size (~200MB)
- ✅ RSS processing fully functional
- ⚠️ YouTube processing gracefully skipped

### 2. Environment Variables for Core Deployment

**Required for RSS Processing:**
```bash
DATABASE_URL="postgresql://worker:password@db.hblelrtwdpukaymtpchv.supabase.co:5432/postgres"
WORKER_DB_PASSWORD="your-worker-password"
SUPABASE_URL="https://hblelrtwdpukaymtpchv.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
NODE_ENV="production"
PORT="8080"
```

**Optional for YouTube (skip for now):**
```bash
# YOUTUBE_API_KEY="your-youtube-key"  # Leave unset to skip YouTube
# YOUTUBE_QUOTA_LIMIT="10000"
# YOUTUBE_QUOTA_RESET_HOUR="0"
```

### 3. Validation

After deployment, verify core functionality:

```bash
# Health check
curl https://your-worker.railway.app/healthz

# Status check (should show YouTube as disabled)
curl https://your-worker.railway.app/debug/status

# Trigger RSS ingestion
curl -X POST https://your-worker.railway.app/debug/ingest-now
```

## 🔮 **Future YouTube Processing Options**

### Option 1: Separate YouTube Service
Deploy YouTube processing as a dedicated service with larger resources:

**Pros:**
- ✅ Dedicated resources for heavy ML processing
- ✅ Independent scaling and deployment
- ✅ Isolation of complex dependencies

**Cons:**
- ❌ Additional service to manage
- ❌ More complex architecture

### Option 2: Different Platform for YouTube Worker
Use a platform better suited for ML workloads:

**Google Cloud Run:**
- ✅ Higher memory limits (up to 32GB)
- ✅ Longer build timeouts
- ✅ Better ML dependency support

**AWS Lambda with Container Images:**
- ✅ Up to 10GB container images
- ✅ 15-minute execution time
- ✅ Good for batch processing

### Option 3: Hybrid Approach
Keep core worker on Railway, add YouTube processing later:

1. **Deploy core RSS worker** to Railway (now)
2. **Add YouTube service** when needed (later)
3. **Queue YouTube jobs** from core worker to YouTube service

## 📊 **Performance Comparison**

| Deployment Type | Build Time | Image Size | Memory Usage | Functionality |
|-----------------|------------|------------|--------------|---------------|
| **Core RSS Only** | ~3 minutes | ~200MB | ~256MB | RSS + LLM Analysis |
| **Full YouTube** | 50+ minutes | ~2GB | ~1GB+ | RSS + YouTube + ML |

## 🎯 **Recommended Immediate Action**

**Deploy Core RSS Worker Now:**

1. ✅ **Fast deployment** gets core functionality live immediately
2. ✅ **Validates infrastructure** and database connectivity
3. ✅ **Enables RSS processing** which is the primary use case
4. ✅ **Provides foundation** for adding YouTube processing later

**Add YouTube Processing Later:**

1. 🔄 **Evaluate usage patterns** to determine if YouTube processing is needed
2. 🔄 **Choose optimal platform** based on requirements and costs
3. 🔄 **Implement as separate service** or upgrade existing deployment

## 🚀 **Next Steps**

1. **Deploy core worker** with current lightweight Dockerfile
2. **Verify RSS processing** works end-to-end
3. **Monitor performance** and resource usage
4. **Plan YouTube processing** based on actual needs and usage patterns

**The core RSS functionality will provide immediate value while we optimize the YouTube processing deployment strategy.**
