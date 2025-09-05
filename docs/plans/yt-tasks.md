# YouTube Ingestion Pipeline Tasks

This checklist captures the complete implementation of YouTube video ingestion for AI-focused content sources. Tasks are organized by implementation priority and technical complexity.

## Current Status (2025-09-05)

**✅ STEEL THREADING COMPLETE**: End-to-end YouTube processing pipeline successfully tested!

- **✅ Audio Extraction**: yt-dlp integration working (10.93MB audio extracted in 9s)
- **✅ Whisper Transcription**: Full transcription with timestamps (213s video → 1,744 chars in 61s)
- **✅ Database Integration**: Worker system integrated with YouTube job queues
- **✅ Error Handling**: Robust cleanup and logging throughout pipeline
- **✅ Source Configuration**: 11 AI research channels + 3 search queries configured

**Pipeline Foundation**: Core RSS pipeline working (47 raw items → 17 stories → 9 overlays). YouTube pipeline ready for production deployment.

**Target Impact**: From ~47 items/day to ~500+ items/day with AI research videos, tech talks, and paper explanations.

**Next Steps**: Fix googleapis client compatibility and deploy to production.

## Phase 1: YouTube API Foundation (Week 1)

### YouTube Data API Integration

- [x] **Environment Setup**: Add YouTube API credentials to `worker/.env`

  - `YOUTUBE_API_KEY=your_youtube_data_api_v3_key`
  - `YOUTUBE_QUOTA_LIMIT=10000` (daily quota limit)
  - `YOUTUBE_QUOTA_RESET_HOUR=0` (UTC reset time)
  - `YOUTUBE_RATE_LIMIT_BUFFER=500` (reserve quota buffer)

- [x] **API Client Implementation**: Create `worker/src/clients/youtube-api.ts`

  - Implement `YouTubeAPIClient` class with rate limiting
  - Add `searchChannels()`, `getChannelUploads()`, `getVideoDetails()` methods
  - Implement quota tracking with `QuotaTracker` interface
  - Add exponential backoff for API failures

- [x] **Quota Management**: Implement quota tracking in `worker/src/utils/quota-tracker.ts`
  - Create `checkQuotaStatus()` function for daily usage monitoring
  - Implement `reserveQuota()` and `consumeQuota()` methods
  - Add quota reset logic at midnight UTC
  - Log quota usage metrics for monitoring

### AI-Focused Source Configuration

- [x] **Channel Sources Setup**: Add AI research channels to `public.sources` table

  ```sql
  -- Lex Fridman Podcast (AI research interviews)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'Lex Fridman Podcast', 'https://www.youtube.com/@lexfridman', 'youtube.com',
   '{"channel_id": "UCSHZKyawb77ixDdsGog4iWA", "upload_playlist_id": "UUSHZKyawb77ixDdsGog4iWA", "category": "ai_research", "priority": "high", "max_videos_per_run": 10}');

  -- Two Minute Papers (AI research explanations)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'Two Minute Papers', 'https://www.youtube.com/@TwoMinutePapers', 'youtube.com',
   '{"channel_id": "UCbfYPyITQ-7l4upoX8nvctg", "upload_playlist_id": "UUbfYPyITQ-7l4upoX8nvctg", "category": "ai_research", "priority": "high", "max_videos_per_run": 5}');
  ```

- [x] **Tech/Startup AI Channels**: Add startup and tech channels with AI focus

  ```sql
  -- Y Combinator (startup talks, many AI companies)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'Y Combinator', 'https://www.youtube.com/@ycombinator', 'youtube.com',
   '{"channel_id": "UCcefcZRL2oaA_uBNeo5UOWg", "upload_playlist_id": "UUcefcZRL2oaA_uBNeo5UOWg", "category": "startup_tech", "priority": "medium", "max_videos_per_run": 8}');

  -- Anthropic (AI safety and research)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'Anthropic', 'https://www.youtube.com/@AnthropicAI', 'youtube.com',
   '{"channel_id": "UCpvYfVOIbW2Tz9Qs8rdvp7w", "upload_playlist_id": "UUpvYfVOIbW2Tz9Qs8rdvp7w", "category": "ai_research", "priority": "high", "max_videos_per_run": 5}');
  ```

- [x] **Search-Based Discovery**: Add AI-focused search queries for broader discovery

  ```sql
  -- AI research paper explanations
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_search', 'AI Research Papers 2024', NULL, 'youtube.com',
   '{"query": "AI research paper explained 2024", "order": "date", "max_results": 10, "published_after": "2024-01-01T00:00:00Z", "duration": "medium", "category": "ai_research"}');

  -- AI startup funding announcements
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_search', 'AI Startup Funding 2024', NULL, 'youtube.com',
   '{"query": "AI startup funding announcement 2024", "order": "relevance", "max_results": 5, "published_after": "2024-01-01T00:00:00Z", "category": "startup_news"}');
  ```

### Database Schema Updates

- [x] **YouTube-Specific Fields**: Add YouTube fields to existing tables

  ```sql
  -- Add YouTube-specific fields to contents table
  ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS transcript_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS view_count bigint;
  ```

- [x] **Indexes for YouTube Content**: Create performance indexes

  ```sql
  CREATE INDEX IF NOT EXISTS idx_contents_audio_url ON public.contents(audio_url) WHERE audio_url IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_contents_transcript_url ON public.contents(transcript_url) WHERE transcript_url IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_raw_items_youtube ON public.raw_items(kind, external_id) WHERE kind = 'youtube';
  ```

- [x] **YouTube Source Validation**: Add metadata validation constraints

  ```sql
  ALTER TABLE public.sources
  ADD CONSTRAINT check_youtube_metadata
  CHECK (
    (kind NOT IN ('youtube_channel', 'youtube_search')) OR
    (metadata IS NOT NULL AND metadata != '{}')
  );
  ```

- [x] **Database Functions**: Create YouTube-specific database functions
  ```sql
  -- Function to get YouTube sources with metadata
  CREATE OR REPLACE FUNCTION get_youtube_sources()
  RETURNS TABLE(id uuid, kind text, name text, url text, domain text, metadata jsonb, last_cursor jsonb)
  LANGUAGE sql AS $$
    SELECT id, kind, name, url, domain, metadata, last_cursor
    FROM public.sources
    WHERE kind IN ('youtube_channel', 'youtube_search')
    AND (metadata IS NOT NULL);
  $$;
  ```

## Phase 2: Audio Processing Pipeline (Week 2)

### yt-dlp Integration

- [x] **Docker Dependencies**: Update `worker/Dockerfile` with yt-dlp and audio processing tools

  ```dockerfile
  # Install system dependencies for YouTube processing
  RUN apt-get update && apt-get install -y \
      python3 \
      python3-pip \
      ffmpeg \
      curl \
      && rm -rf /var/lib/apt/lists/*

  # Install yt-dlp
  RUN pip3 install --no-cache-dir yt-dlp==2024.1.7
  ```

- [x] **Audio Extraction Module**: Create `worker/src/extract/youtube-audio.ts`

  - Implement `extractAudio(videoUrl, videoId)` function
  - Use yt-dlp with m4a format, best quality settings
  - Add 500MB file size limit and 10-minute timeout
  - Handle extraction errors with proper logging

- [x] **Video Metadata Extraction**: Implement `getVideoMetadata(videoId)` in same module

  - Extract duration, view count, like count using yt-dlp --dump-json
  - Add 30-second timeout for metadata requests
  - Parse JSON output and handle malformed responses
  - Store metadata for AI analysis context

- [x] **Temp File Management**: Add cleanup utilities in `worker/src/utils/temp-files.ts`
  - Implement `createTempPath(videoId, extension)` function
  - Add `cleanupTempFiles(filePaths)` with error handling
  - Use `/tmp/youtube-processing/` directory with proper permissions
  - Log cleanup operations for debugging

### Whisper Transcription Pipeline

- [x] **Whisper Installation**: Add Whisper to Docker container

  ```dockerfile
  # Install Whisper for transcription
  RUN pip3 install --no-cache-dir \
      openai-whisper==20231117 \
      torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
  ```

- [x] **Transcription Module**: Create `worker/src/transcribe/whisper.ts`

  - Implement `transcribeAudio(audioPath, videoId)` function
  - Use 'base' model by default (configurable via `WHISPER_MODEL` env var)
  - Output JSON format with timestamps for video synchronization
  - Add dynamic timeout based on audio file size

- [x] **JSON Processing**: Add JSON parsing utilities (implemented in whisper.ts)

  - Implement `transcribeAudio()` with JSON output format
  - Parse timestamps and segments from Whisper JSON
  - Extract plain text transcript for AI analysis
  - Detect language from Whisper metadata

- [ ] **Transcription Environment**: Add Whisper configuration to `worker/.env`
  ```bash
  WHISPER_MODEL=base  # Options: tiny, base, small, medium, large
  WHISPER_PATH=/usr/local/bin/whisper
  MAX_VIDEO_DURATION=7200  # 2 hours in seconds
  MAX_AUDIO_FILE_SIZE=524288000  # 500MB in bytes
  ```

### Supabase Storage Integration

- [ ] **Storage Buckets Setup**: Create YouTube-specific storage buckets

  ```sql
  -- Create Supabase Storage buckets for YouTube content
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('youtube-audio', 'youtube-audio', false, 524288000, ARRAY['audio/mp4', 'audio/m4a']), -- 500MB limit
  ('youtube-transcripts', 'youtube-transcripts', false, 10485760, ARRAY['text/vtt', 'text/plain']); -- 10MB limit
  ```

- [ ] **Storage RLS Policies**: Set up Row Level Security for YouTube buckets

  ```sql
  -- Service role can manage youtube-audio
  CREATE POLICY "Service role can manage youtube-audio" ON storage.objects
  FOR ALL USING (bucket_id = 'youtube-audio' AND auth.role() = 'service_role');

  -- Authenticated users can read transcripts
  CREATE POLICY "Authenticated users can read transcripts" ON storage.objects
  FOR SELECT USING (bucket_id = 'youtube-transcripts' AND auth.role() = 'authenticated');
  ```

- [ ] **Upload Utilities**: Create `worker/src/storage/youtube-uploads.ts`
  - Implement `uploadAudio(videoId, audioPath)` function
  - Implement `uploadTranscript(videoId, vttContent)` function
  - Add proper content-type headers and upsert logic
  - Return storage URLs for database storage

## Phase 3: Worker Integration (Week 2-3)

### YouTube Ingestion Worker

- [x] **Ingestion Module**: Create `worker/src/ingest/youtube.ts`

  - Implement `runIngestYouTube(boss)` main function
  - Add `processChannelSource()` and `processSearchSource()` for individual sources
  - Implement channel video discovery using uploads playlist ID
  - Implement search-based video discovery with query processing

- [x] **Channel Processing**: Implement channel video discovery

  - Use YouTube Data API `getChannelUploads()` for channel uploads
  - Process videos in reverse chronological order (newest first)
  - Respect `max_videos_per_run` from source metadata
  - Update cursor with `publishedAfter` for incremental fetching

- [x] **Search Processing**: Implement search-based video discovery

  - Use YouTube Data API `searchVideos()` with video type filter
  - Handle pagination and quota management
  - Apply date filters and duration constraints from source metadata
  - Track search query performance and quota usage

- [x] **Raw Item Creation**: Implement YouTube raw item upserts
  - Create `upsertRawItem()` function for YouTube videos
  - Extract video metadata (title, description, thumbnail, channel info)
  - Set `kind = 'youtube'` and `external_id = videoId`
  - Enqueue `ingest:fetch-youtube-content` jobs for new videos

### Content Extraction Worker

- [x] **YouTube Extraction Module**: Create `worker/src/extract/youtube.ts`

  - Implement `runYouTubeFetchAndExtract(jobData, boss)` main function
  - Filter raw items by `kind = 'youtube'` for processing
  - Orchestrate audio extraction → transcription → content creation
  - Handle extraction errors with proper logging and retries

- [x] **Content Creation Pipeline**: Implement full YouTube content processing

  - Extract audio using yt-dlp with quality settings (✅ TESTED)
  - Transcribe audio using Whisper with video-optimized settings (✅ TESTED)
  - Create enhanced content with video metadata and timestamps
  - Create `contents` record with transcript text and metadata
  - Create or link `stories` record using content_hash deduplication

- [ ] **Enhanced Metadata**: Store YouTube-specific metadata in content records

  ```typescript
  const contentMetadata = {
    channel_id: videoData.channelId,
    channel_title: videoData.channelTitle,
    published_at: videoData.publishedAt,
    duration_seconds: videoMetadata.duration,
    view_count: videoMetadata.viewCount,
    like_count: videoMetadata.likeCount,
    transcript_format: 'vtt',
    audio_format: 'm4a',
    extraction_timestamp: new Date().toISOString(),
  };
  ```

- [x] **AI Analysis Integration**: Enqueue YouTube content for AI analysis
  - Send `analyze:llm` jobs with `storyId` after content creation
  - Pass YouTube-specific context (channel authority, view count, duration)
  - Enable video-specific AI analysis prompts

### Worker Scheduling Integration

- [x] **YouTube Scheduling**: Add YouTube ingestion to worker cron schedule

  ```typescript
  // Add YouTube scheduling (every 15 minutes, offset from RSS)
  await boss.schedule('ingest:pull', '*/15 * * * *', { source: 'youtube' }, { tz: CRON_TZ });
  ```

- [x] **Ingest Worker Updates**: Update `worker/src/worker.ts` ingest:pull handler

  - Add YouTube source handling in main ingest:pull worker
  - Call `runIngestYouTube(boss)` when `source === 'youtube'`
  - Maintain separate processing for RSS and YouTube sources
  - Log source-specific metrics and performance

- [x] **Content Fetch Updates**: Update ingest:fetch-content worker for YouTube

  - Create separate `ingest:fetch-youtube-content` queue
  - Route YouTube items to `runYouTubeFetchAndExtract()` function
  - Route article items to existing `runFetchAndExtract()` function
  - Process different content types with appropriate extractors

- [ ] **Concurrency Configuration**: Optimize worker concurrency for YouTube processing
  - Set `teamSize: 2, teamConcurrency: 1` for fetch-content jobs
  - Add separate concurrency limits for transcription-heavy jobs
  - Configure Cloud Run with increased memory (4Gi) and CPU (2) for video processing
  - Set timeout to 1800 seconds (30 minutes) for long transcriptions

## 🚧 **Remaining Work for Production**

### Critical Path Items (BLOCKING PRODUCTION)

- [x] **Fix googleapis Client**: Update `worker/src/clients/youtube-api.ts` for googleapis v159

  - [x] Fix `part` parameter to use string arrays instead of strings (lines 86, 279)
  - [x] Update response handling for new googleapis response structure
  - [x] Fix null/undefined type mismatches in video properties
  - [ ] Test API client with real YouTube API calls

- [x] **Fix Frontend Type Errors**: Resolve TypeScript compilation errors

  - [x] Fix FeedList.tsx async/await issue (missing await on Promise<Cluster[]>)
  - [x] Generate missing Supabase types file (`src/libs/supabase/types.ts`)
  - [x] Fix pricing component parameter types (implicit 'any' types)
  - [x] Fix @react-email/tailwind import error in welcome.tsx

- [x] **Production Testing**: Test full pipeline with real AI research channels

  - [x] Test YouTube API client with real API calls (✅ WORKING)
  - [x] Test video search functionality (✅ Found 2 videos for "AI research")
  - [x] Test channel uploads fetching (✅ Two Minute Papers channel working)
  - [x] Test video metadata extraction (✅ 314s video, 51,914 views extracted)
  - [x] Verify quota management (✅ Tracking 100 units for search, 1 for playlist)
  - [x] Test system dependencies (✅ yt-dlp and whisper installed and working)

### Optional Enhancements (Post-Production)

- [ ] **Performance Optimization**: Optimize for production workloads
  - Implement parallel processing for multiple videos
  - Add video duration limits and quality filters
  - Optimize Whisper model selection based on video length
  - Add storage cleanup for old audio files

### ✅ COMPLETED: Storage Integration (Production Ready)

**IMPLEMENTED STORAGE STRATEGY**: Database-first approach - VTT content stored directly in `contents.transcript_vtt` field.

- [x] **Database Schema Updates**: Added transcript storage fields (COMPLETE - 2025-09-05)

  ```sql
  -- Added to contents table
  ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS transcript_vtt text;
  CREATE INDEX IF NOT EXISTS idx_contents_transcript_vtt ON public.contents(id) WHERE transcript_vtt IS NOT NULL;
  ```

- [x] **Storage Module Implementation**: Created database-first transcript processing (COMPLETE - 2025-09-05)

  - ✅ Created `worker/src/storage/youtube-uploads.ts` with `prepareYouTubeTranscript()` function
  - ✅ Implemented `generateVTTContent()` for WebVTT format conversion
  - ✅ Used existing database connection pattern (no additional Supabase client)
  - ✅ Store VTT content directly in `contents.transcript_vtt` field
  - ✅ Generate transcript URL pattern: `youtube://{videoId}`

- [x] **Database Integration**: Updated extraction pipeline for transcript storage (COMPLETE - 2025-09-05)

  - ✅ Modified `worker/src/extract/youtube.ts` to use new storage functions
  - ✅ Updated `insertContents()` in `worker/src/db.ts` to handle transcript fields
  - ✅ Store transcript URL in `contents.transcript_url` field
  - ✅ Store VTT content in `contents.transcript_vtt` field
  - ✅ Added comprehensive logging for transcript processing

- [x] **End-to-End Testing**: Verified complete YouTube processing pipeline (COMPLETE - 2025-09-05)

  - ✅ Audio extraction: 10.93MB in 9s using yt-dlp
  - ✅ Transcription: 1,814 chars in 56s using Whisper
  - ✅ VTT generation: 69 segments with timestamps
  - ✅ Database storage: VTT content stored successfully
  - ✅ Build verification: TypeScript compilation successful

### NEXT PRIORITY: Frontend Integration (Required for User Experience)

**FRONTEND INTEGRATION STRATEGY**: YouTube content integrated into existing stories interface with enhanced transcript features.

- [ ] **Stories Feed Integration**: Display YouTube content in main stories feed (HIGH - 30 minutes)

  - Update stories controller to fetch YouTube content from database
  - Ensure YouTube stories appear alongside articles in chronological order
  - Display video metadata (title, channel, duration, view count) in story cards
  - Add YouTube video thumbnail and channel branding
  - Test YouTube stories appear correctly in `/today` feed

- [ ] **Story Detail View Layout**: Implement YouTube-specific story layout (HIGH - 45 minutes)

  - **Left Side**: YouTube video iframe embed with responsive sizing
  - **Right Sidebar**: "Why It Matters" section (above existing content)
  - **Main Content Area**: Internal transcript reader with full VTT content
  - Maintain consistent layout with article stories
  - Ensure mobile responsiveness for video + transcript layout

- [ ] **Internal Transcript Reader**: Build interactive transcript viewer (CRITICAL - 60 minutes)

  - Fetch VTT content from `contents.transcript_vtt` database field
  - Parse WebVTT format to extract timestamps and text segments
  - Display transcript with clickable timestamp links
  - Implement timestamp synchronization with YouTube iframe
  - Add search functionality within transcript text
  - Style transcript segments for readability (speaker detection, paragraph breaks)

- [ ] **Video-Transcript Synchronization**: Enable timestamp navigation (MEDIUM - 30 minutes)

  - Implement YouTube iframe API integration for playback control
  - Add click handlers for timestamp links to seek video
  - Highlight current transcript segment based on video playback time
  - Add auto-scroll functionality to follow video progress
  - Handle edge cases (video loading, network issues)

### Current Type Errors Summary (2025-09-05)

**TypeScript Compilation Status**: ✅ 0 errors - ALL RESOLVED!

**Resolved Critical Errors**:

- [x] `worker/src/clients/youtube-api.ts`: 4 errors (googleapis v159 compatibility) - FIXED
- [x] `src/libs/supabase/types.ts`: Missing module (6 import errors) - GENERATED
- [x] `src/components/feed/FeedList.tsx`: Async/await issues (2 errors) - FIXED
- [x] `src/features/pricing/components/price-card.tsx`: Implicit any types (3 errors) - RESOLVED
- [x] `src/features/emails/welcome.tsx`: Missing @react-email/tailwind (1 error) - INSTALLED

### NEXT PRIORITY: AI Analysis Enhancement (Required for Content Value)

**AI ANALYSIS STRATEGY**: YouTube-specific prompts to extract maximum value from video content for AI researchers and engineers.

- [ ] **"Why It Matters" Analysis**: Extract key insights for AI researchers (HIGH - 45 minutes)

  - Create YouTube-specific analysis prompt focusing on research significance
  - Extract 3-5 bullet points highlighting practical implications
  - Emphasize relevance to AI researchers and software engineers
  - Include impact on current research trends and methodologies
  - Store results in `story_overlays.why_it_matters` field

- [ ] **"Technical Stack/Tools" Analysis**: Identify technologies mentioned (MEDIUM - 30 minutes)

  - Create structured analysis prompt for technical content extraction
  - Generate list of technologies, frameworks, tools, and methodologies
  - Include precise timestamps for each mention (format: "Tool Name - [MM:SS] brief context")
  - Categorize by type (ML frameworks, cloud platforms, programming languages, etc.)
  - Store results in new `story_overlays.technical_stack` field

- [ ] **Enhanced Content Analysis**: Additional YouTube-specific insights (LOW - 60 minutes)

  - **Key Concepts**: Extract main technical concepts and definitions
  - **Research Papers**: Identify and link mentioned academic papers
  - **Implementation Details**: Capture specific code examples or architectural patterns
  - **Future Implications**: Analyze potential impact on industry/research
  - Plan database schema for additional analysis fields

**Next Steps for Production** (Updated 2025-09-05):

1. [x] Test YouTube API client with real API calls
2. [x] Test end-to-end YouTube processing pipeline
3. [x] **COMPLETE**: Implement Database-First Transcript Storage
   - ✅ **Priority 1**: Added `transcript_vtt` field to contents table
   - ✅ **Priority 2**: Created transcript processing functions
   - ✅ **Priority 3**: Updated extraction pipeline integration
   - ✅ **Priority 4**: Verified end-to-end functionality
4. [ ] **CRITICAL**: Frontend Integration for YouTube Content Display
5. [ ] **HIGH**: AI Analysis Enhancement for YouTube Content
6. [ ] Deploy to production and verify complete user experience

**CURRENT STATUS**: Core YouTube pipeline complete and production-ready. Frontend integration and AI analysis are next priorities for full user experience.

## Phase 4: Enhanced AI Analysis (Week 3)

### YouTube-Specific AI Analysis

- [ ] **YouTube Analysis Prompts**: Create video-specific analysis in `worker/src/analyze/llm.ts`

  ```typescript
  const YOUTUBE_ANALYSIS_PROMPT = `
  You are analyzing a YouTube video transcript. Consider the video format and speaker context.
  
  Video Title: {title}
  Channel: {channel_title}
  Duration: {duration_minutes} minutes
  View Count: {view_count}
  Published: {published_date}
  
  Transcript: {transcript}
  
  Provide analysis considering:
  - Speaker expertise and channel authority
  - Information novelty and exclusivity
  - Production quality and content depth
  - Technical accuracy and evidence quality
  `;
  ```

- [ ] **Enhanced Analysis Function**: Implement `analyzeYouTubeContent(story, content)`

  - Use larger context window (8000 chars) for video transcripts
  - Include video metadata in analysis context
  - Generate video-specific confidence scores based on channel authority
  - Extract timestamp-based citations for video references

- [ ] **Analysis Router Updates**: Update main `runAnalyzeLLM()` function

  - Route YouTube stories to `analyzeYouTubeContent()`
  - Route podcast stories to `analyzePodcastContent()` (future)
  - Route article stories to existing `analyzeArticleContent()`
  - Maintain consistent analysis output format across content types

- [ ] **Citation Enhancement**: Improve citation extraction for video content
  - Parse video timestamps from transcript context
  - Link citations to specific moments in video (MM:SS format)
  - Extract mentioned URLs, papers, and resources from transcript
  - Store citation metadata with video-specific context

### Embedding Generation

- [ ] **YouTube Embedding**: Optimize embeddings for video transcripts

  - Use text-embedding-3-small with 6000 character limit for videos
  - Chunk long transcripts intelligently (by topic/speaker segments)
  - Generate embeddings for both full transcript and key segments
  - Store embeddings with video-specific metadata

- [ ] **Embedding Metadata**: Enhance embedding records with YouTube context
  ```typescript
  const embeddingMetadata = {
    content_type: 'youtube_transcript',
    channel_id: story.metadata.channel_id,
    duration_seconds: story.metadata.duration_seconds,
    view_count: story.metadata.view_count,
    transcript_language: content.lang,
    embedding_model: 'text-embedding-3-small-v1',
  };
  ```

## Phase 5: Monitoring & Deployment (Week 3-4)

### Error Handling & Recovery

- [ ] **YouTube-Specific Error Classes**: Create error handling in `worker/src/errors/youtube-errors.ts`

  ```typescript
  class YouTubeProcessingError extends Error {
    constructor(
      message: string,
      public readonly videoId: string,
      public readonly errorType: 'quota' | 'extraction' | 'transcription' | 'upload' | 'analysis',
      public readonly retryable: boolean = false
    ) {
      super(message);
      this.name = 'YouTubeProcessingError';
    }
  }
  ```

- [ ] **Retry Logic**: Implement exponential backoff for YouTube operations

  - Add `withRetry<T>(operation, maxRetries, baseDelay)` utility function
  - Implement `isRetryableError(error)` for YouTube-specific error classification
  - Handle quota exceeded errors (non-retryable)
  - Handle network timeouts and connection errors (retryable)

- [ ] **Graceful Degradation**: Handle YouTube API failures
  - Continue processing other sources when YouTube API is down
  - Skip quota-heavy operations when approaching daily limits
  - Log quota exhaustion events for monitoring
  - Implement fallback to cached channel data when API unavailable

### Monitoring & Observability

- [ ] **YouTube Metrics**: Add YouTube-specific logging and metrics

  ```typescript
  interface YouTubeMetrics {
    videos_discovered: number;
    videos_processed: number;
    quota_used: number;
    quota_remaining: number;
    avg_extraction_time_ms: number;
    avg_transcription_time_ms: number;
    transcription_success_rate: number;
    analysis_success_rate: number;
  }
  ```

- [ ] **Dashboard Queries**: Create monitoring queries for YouTube pipeline

  ```sql
  -- Daily YouTube ingestion summary
  SELECT
    DATE(discovered_at) as date,
    COUNT(*) FILTER (WHERE kind = 'youtube') as youtube_videos,
    AVG(LENGTH(contents.text)) FILTER (WHERE raw_items.kind = 'youtube') as avg_transcript_length,
    AVG((raw_items.metadata->>'duration_seconds')::int) FILTER (WHERE kind = 'youtube') as avg_duration
  FROM raw_items
  LEFT JOIN contents ON contents.raw_item_id = raw_items.id
  WHERE discovered_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE(discovered_at);
  ```

- [ ] **Quota Monitoring**: Track YouTube API quota usage

  ```sql
  -- Quota usage tracking
  SELECT
    s.name,
    s.kind,
    (s.last_cursor->>'quotaUsed')::int as quota_used,
    s.last_cursor->>'lastSuccessfulRun' as last_run,
    (s.last_cursor->>'videosProcessed')::int as videos_processed
  FROM sources s
  WHERE s.kind IN ('youtube_channel', 'youtube_search')
  ORDER BY quota_used DESC;
  ```

- [ ] **Performance Monitoring**: Add Cloud Run monitoring for video processing
  - Monitor memory usage during transcription (expect 2-4GB for long videos)
  - Track processing time per video (target: <10 minutes for 2-hour videos)
  - Monitor storage usage growth (audio files can be 100-500MB each)
  - Set up alerts for quota exhaustion and processing failures

### Cloud Run Deployment

- [ ] **Resource Configuration**: Update Cloud Run deployment for video processing

  ```bash
  gcloud run deploy zeke-worker \
    --image gcr.io/your-project/zeke-worker \
    --platform managed \
    --region us-central1 \
    --memory 4Gi \
    --cpu 2 \
    --timeout 1800 \
    --concurrency 1 \
    --max-instances 3 \
    --set-env-vars YOUTUBE_API_KEY=$YOUTUBE_API_KEY,WHISPER_MODEL=base
  ```

- [ ] **Environment Variables**: Configure production environment

  ```bash
  # Production YouTube configuration
  YOUTUBE_API_KEY=your_production_youtube_api_key
  YOUTUBE_QUOTA_LIMIT=10000
  WHISPER_MODEL=base
  MAX_VIDEO_DURATION=7200
  MAX_AUDIO_FILE_SIZE=524288000
  ```

- [ ] **Health Checks**: Add YouTube-specific health monitoring
  - Verify YouTube API connectivity in health check endpoint
  - Check Whisper installation and model availability
  - Validate Supabase Storage bucket access
  - Monitor temp directory disk space usage

## Additional AI-Focused Channels (Phase 1 Extension)

### Research & Academic Channels

- [ ] **AI Research Institutions**: Add university and research lab channels

  ```sql
  -- MIT CSAIL (Computer Science and Artificial Intelligence Laboratory)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'MIT CSAIL', 'https://www.youtube.com/@MITCSAIL', 'youtube.com',
   '{"channel_id": "UCBpxspUNl1Th33XbugiHJzw", "upload_playlist_id": "UUBpxspUNl1Th33XbugiHJzw", "category": "ai_research", "priority": "high", "max_videos_per_run": 8}');

  -- Stanford HAI (Human-Centered AI Institute)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'Stanford HAI', 'https://www.youtube.com/@StanfordHAI', 'youtube.com',
   '{"channel_id": "UC4R8DWoMoI7CAwX8_LjQHig", "upload_playlist_id": "UU4R8DWoMoI7CAwX8_LjQHig", "category": "ai_research", "priority": "high", "max_videos_per_run": 6}');
  ```

- [ ] **AI Company Channels**: Add major AI company official channels

  ```sql
  -- OpenAI (GPT, ChatGPT, DALL-E research)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'OpenAI', 'https://www.youtube.com/@OpenAI', 'youtube.com',
   '{"channel_id": "UCXZCJLdBC09xxGZ6gcdrc6A", "upload_playlist_id": "UUXZCJLdBC09xxGZ6gcdrc6A", "category": "ai_research", "priority": "high", "max_videos_per_run": 5}');

  -- DeepMind (Google DeepMind research)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'DeepMind', 'https://www.youtube.com/@DeepMind', 'youtube.com',
   '{"channel_id": "UCP7jMXSY2xbc3KCAE0MHQ-A", "upload_playlist_id": "UUP7jMXSY2xbc3KCAE0MHQ-A", "category": "ai_research", "priority": "high", "max_videos_per_run": 5}');
  ```

### Tech Conference & Event Channels

- [ ] **AI Conference Channels**: Add major AI conference channels

  ```sql
  -- NeurIPS (Neural Information Processing Systems)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'NeurIPS', 'https://www.youtube.com/@NeurIPSConf', 'youtube.com',
   '{"channel_id": "UC_4dWbdOgJwZHWP-FGlx2yw", "upload_playlist_id": "UU_4dWbdOgJwZHWP-FGlx2yw", "category": "ai_research", "priority": "medium", "max_videos_per_run": 10}');

  -- ICML (International Conference on Machine Learning)
  INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
  ('youtube_channel', 'ICML', 'https://www.youtube.com/@ICMLConf', 'youtube.com',
   '{"channel_id": "UC74C4hHWkAWDp5LrHmZbfvA", "upload_playlist_id": "UU74C4hHWkAWDp5LrHmZbfvA", "category": "ai_research", "priority": "medium", "max_videos_per_run": 8}');
  ```

## Expected Impact Metrics

### Content Volume Increase

- **Current**: ~47 raw items/day (2 RSS sources)
- **Target**: ~500+ raw items/day (2 RSS + 15 YouTube channels + 5 search queries)
- **Multiplier**: **10x content volume increase**

### Content Quality Enhancement

- **Rich Metadata**: Video duration, view counts, channel authority for AI analysis
- **Searchable Transcripts**: Full-text search across video content
- **Speaker Context**: Channel expertise and authority in AI analysis
- **Multi-language Support**: Auto-detected language from Whisper transcription

### AI Analysis Improvement

- **Video-Specific Prompts**: Consider speaker expertise and channel authority
- **Timestamp Citations**: Link references to specific video moments
- **Enhanced Confidence**: Factor in view count, channel authority, and content depth
- **Contextual Understanding**: Leverage video format and conversational context

### Resource Efficiency

- **Quota Management**: Efficient use of YouTube API quota (10,000 units/day)
- **Processing Optimization**: Parallel audio extraction and transcription
- **Storage Management**: Automatic cleanup of temporary files
- **Cost Control**: Monitor and limit processing costs for long videos

### Technical Performance Targets

- **Processing Speed**: <10 minutes for 2-hour videos (extraction + transcription)
- **Success Rate**: >95% transcription success rate for English content
- **Storage Efficiency**: <1GB total storage per 100 videos processed
- **API Efficiency**: <8,000 quota units/day usage (80% of daily limit)

This comprehensive task breakdown provides a step-by-step implementation guide for YouTube ingestion focused on AI-related content sources, following the exact format and specificity of the existing pipeline-tasks.md document.
