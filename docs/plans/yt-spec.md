# YouTube Ingestion Pipeline Specification

**Status**: Planning Phase  
**Priority**: High Impact - 10x content volume increase  
**Dependencies**: YouTube Data API v3, yt-dlp, Whisper/faster-whisper

This document specifies the complete implementation of YouTube video ingestion for the ZEKE pipeline, including audio extraction, transcription, and AI analysis integration.

## Architecture Overview

YouTube ingestion follows the existing ZEKE pipeline patterns:

1. **Source Discovery**: YouTube Data API for channels/search
2. **Content Extraction**: yt-dlp audio + Whisper transcription
3. **Storage**: Supabase Storage for audio/transcripts, PostgreSQL for metadata
4. **Analysis**: Existing `analyze:llm` pipeline processes transcripts
5. **Serving**: Internal reader displays transcripts with timestamps

## YouTube Data API Integration

### Authentication & Setup

```bash
# Required environment variables
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
YOUTUBE_QUOTA_LIMIT=10000  # Daily quota limit for monitoring
YOUTUBE_QUOTA_RESET_HOUR=0  # UTC hour when quota resets (0 = midnight)
```

### API Quotas & Rate Limits

- **Daily Quota**: 10,000 units (default free tier)
- **Cost Structure**:
  - Channel playlist items: 1 unit per request (50 videos max)
  - Video details: 1 unit per request
  - Search queries: 100 units per request (50 results max)
  - Channel details: 1 unit per request

### Quota Management Strategy

```typescript
interface QuotaTracker {
  dailyUsed: number;
  dailyLimit: number;
  lastReset: string; // ISO timestamp
  reserveBuffer: number; // Units to keep in reserve (500)
}

// Quota allocation priority:
// 1. Channel subscriptions: 70% of quota (efficient, high-quality)
// 2. Search queries: 20% of quota (discovery, higher cost)
// 3. Reserve buffer: 10% of quota (error recovery, manual testing)
```

## Source Configuration

### YouTube Source Types

```sql
-- Channel-based sources (most quota-efficient)
INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
('youtube_channel', 'Lex Fridman Podcast', 'https://www.youtube.com/@lexfridman', 'youtube.com',
 '{
   "channel_id": "UCSHZKyawb77ixDdsGog4iWA",
   "upload_playlist_id": "UUSHZKyawb77ixDdsGog4iWA",
   "category": "ai_research",
   "priority": "high",
   "max_videos_per_run": 10
 }'),

('youtube_channel', 'Two Minute Papers', 'https://www.youtube.com/@TwoMinutePapers', 'youtube.com',
 '{
   "channel_id": "UCbfYPyITQ-7l4upoX8nvctg",
   "upload_playlist_id": "UUbfYPyITQ-7l4upoX8nvctg",
   "category": "ai_research",
   "priority": "high",
   "max_videos_per_run": 5
 }'),

-- Search-based sources (higher quota cost, broader discovery)
('youtube_search', 'AI Research Papers', NULL, 'youtube.com',
 '{
   "query": "AI research paper explained",
   "order": "date",
   "max_results": 10,
   "published_after": "2024-01-01T00:00:00Z",
   "duration": "medium",
   "category": "ai_research"
 }'),

('youtube_search', 'Tech Startup Funding', NULL, 'youtube.com',
 '{
   "query": "startup funding announcement 2024",
   "order": "relevance",
   "max_results": 5,
   "published_after": "2024-01-01T00:00:00Z",
   "category": "startup_news"
 }');
```

### Cursor Management

```typescript
interface YouTubeCursor {
  // Channel ingestion
  publishedAfter?: string; // ISO 8601 - only fetch videos after this time
  lastVideoId?: string; // Last processed video ID for deduplication

  // Search ingestion
  nextPageToken?: string; // YouTube API pagination token
  searchTimestamp?: string; // When search was last performed

  // Quota tracking
  quotaUsed?: number; // Units consumed today
  quotaResetAt?: string; // When quota counter resets

  // Performance metrics
  videosProcessed?: number; // Videos processed in last run
  avgProcessingTime?: number; // Average processing time per video
  lastSuccessfulRun?: string; // Timestamp of last successful ingestion
}
```

## Worker Implementation

### YouTube Ingestion Module

```typescript
// worker/src/ingest/youtube.ts
import { google } from 'googleapis';
import PgBoss from 'pg-boss';
import { getYouTubeSources, upsertRawItem, updateSourceCursor } from '../db.js';
import { log } from '../log.js';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

const QUOTA_LIMIT = parseInt(process.env.YOUTUBE_QUOTA_LIMIT || '10000');
const QUOTA_BUFFER = 500; // Reserve buffer for error recovery

export async function runIngestYouTube(boss: PgBoss): Promise<void> {
  const sources = await getYouTubeSources();
  let totalQuotaUsed = 0;

  // Check current quota usage
  const quotaStatus = await checkQuotaStatus(sources);
  if (quotaStatus.remaining < QUOTA_BUFFER) {
    log(
      'youtube_quota_exhausted',
      {
        remaining: quotaStatus.remaining,
        buffer: QUOTA_BUFFER,
      },
      'warn'
    );
    return;
  }

  // Process sources by priority (channels first, then search)
  const channelSources = sources.filter((s) => s.kind === 'youtube_channel');
  const searchSources = sources.filter((s) => s.kind === 'youtube_search');

  for (const source of [...channelSources, ...searchSources]) {
    try {
      const quotaUsed = await processYouTubeSource(source, boss);
      totalQuotaUsed += quotaUsed;

      // Stop if approaching quota limit
      if (totalQuotaUsed > QUOTA_LIMIT - QUOTA_BUFFER) {
        log(
          'youtube_quota_limit_reached',
          {
            totalUsed: totalQuotaUsed,
            limit: QUOTA_LIMIT,
          },
          'warn'
        );
        break;
      }
    } catch (error) {
      log(
        'youtube_source_error',
        {
          source_id: source.id,
          source_kind: source.kind,
          error: String(error),
        },
        'error'
      );
    }
  }

  log('youtube_ingestion_complete', {
    sources_processed: sources.length,
    quota_used: totalQuotaUsed,
    quota_remaining: QUOTA_LIMIT - totalQuotaUsed,
  });
}

async function processYouTubeSource(source: SourceRow, boss: PgBoss): Promise<number> {
  if (source.kind === 'youtube_channel') {
    return await ingestChannelVideos(source, boss);
  } else if (source.kind === 'youtube_search') {
    return await ingestSearchResults(source, boss);
  }
  return 0;
}

async function ingestChannelVideos(source: SourceRow, boss: PgBoss): Promise<number> {
  const metadata = source.metadata as any;
  const cursor = (source.last_cursor as YouTubeCursor) || {};
  const maxVideos = metadata.max_videos_per_run || 10;

  log('youtube_channel_start', {
    source_id: source.id,
    channel_id: metadata.channel_id,
    published_after: cursor.publishedAfter,
  });

  // Fetch channel's upload playlist
  const playlistResponse = await youtube.playlistItems.list({
    part: ['snippet', 'contentDetails'],
    playlistId: metadata.upload_playlist_id,
    maxResults: Math.min(maxVideos, 50),
    publishedAfter: cursor.publishedAfter,
    order: 'date',
  });

  let newCount = 0;
  let quotaUsed = 1; // 1 unit for playlist request

  const items = playlistResponse.data.items || [];
  for (const item of items) {
    const videoId = item.contentDetails?.videoId;
    if (!videoId) continue;

    // Check if we already processed this video
    if (cursor.lastVideoId === videoId) break;

    const rawItemId = await upsertRawItem({
      source_id: source.id,
      external_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: item.snippet?.title || null,
      kind: 'youtube',
      metadata: {
        channel_id: item.snippet?.channelId,
        channel_title: item.snippet?.channelTitle,
        published_at: item.snippet?.publishedAt,
        description: item.snippet?.description,
        thumbnail_url: item.snippet?.thumbnails?.medium?.url,
        duration: null, // Will be filled during content extraction
        view_count: null, // Will be filled during content extraction
        category: metadata.category,
      },
    });

    if (rawItemId) {
      await boss.send('ingest:fetch-content', { rawItemIds: [rawItemId] });
      newCount++;
    }
  }

  // Update cursor with latest video info
  const latestVideo = items[0];
  if (latestVideo) {
    await updateSourceCursor(source.id, {
      publishedAfter: latestVideo.snippet?.publishedAt || cursor.publishedAfter,
      lastVideoId: latestVideo.contentDetails?.videoId || cursor.lastVideoId,
      quotaUsed: (cursor.quotaUsed || 0) + quotaUsed,
      videosProcessed: newCount,
      lastSuccessfulRun: new Date().toISOString(),
    });
  }

  log('youtube_channel_complete', {
    source_id: source.id,
    channel_id: metadata.channel_id,
    videos_found: items.length,
    videos_new: newCount,
    quota_used: quotaUsed,
  });

  return quotaUsed;
}

async function ingestSearchResults(source: SourceRow, boss: PgBoss): Promise<number> {
  const metadata = source.metadata as any;
  const cursor = (source.last_cursor as YouTubeCursor) || {};
  const maxResults = Math.min(metadata.max_results || 10, 50);

  log('youtube_search_start', {
    source_id: source.id,
    query: metadata.query,
    max_results: maxResults,
  });

  // Perform search query
  const searchResponse = await youtube.search.list({
    part: ['snippet'],
    q: metadata.query,
    type: 'video',
    order: metadata.order || 'relevance',
    maxResults: maxResults,
    publishedAfter: metadata.published_after || cursor.searchTimestamp,
    videoDuration: metadata.duration || 'any',
    pageToken: cursor.nextPageToken,
  });

  let newCount = 0;
  let quotaUsed = 100; // 100 units for search request

  const items = searchResponse.data.items || [];
  for (const item of items) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;

    const rawItemId = await upsertRawItem({
      source_id: source.id,
      external_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: item.snippet?.title || null,
      kind: 'youtube',
      metadata: {
        channel_id: item.snippet?.channelId,
        channel_title: item.snippet?.channelTitle,
        published_at: item.snippet?.publishedAt,
        description: item.snippet?.description,
        thumbnail_url: item.snippet?.thumbnails?.medium?.url,
        search_query: metadata.query,
        search_rank: items.indexOf(item) + 1,
        category: metadata.category,
      },
    });

    if (rawItemId) {
      await boss.send('ingest:fetch-content', { rawItemIds: [rawItemId] });
      newCount++;
    }
  }

  // Update cursor
  await updateSourceCursor(source.id, {
    nextPageToken: searchResponse.data.nextPageToken || null,
    searchTimestamp: new Date().toISOString(),
    quotaUsed: (cursor.quotaUsed || 0) + quotaUsed,
    videosProcessed: newCount,
    lastSuccessfulRun: new Date().toISOString(),
  });

  log('youtube_search_complete', {
    source_id: source.id,
    query: metadata.query,
    videos_found: items.length,
    videos_new: newCount,
    quota_used: quotaUsed,
  });

  return quotaUsed;
}

async function checkQuotaStatus(sources: SourceRow[]): Promise<{ used: number; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];
  let totalUsed = 0;

  for (const source of sources) {
    const cursor = source.last_cursor as YouTubeCursor;
    if (cursor?.quotaUsed && cursor.quotaResetAt?.startsWith(today)) {
      totalUsed += cursor.quotaUsed;
    }
  }

  return {
    used: totalUsed,
    remaining: QUOTA_LIMIT - totalUsed,
  };
}
```

### Database Functions

```sql
-- Get YouTube sources with metadata
CREATE OR REPLACE FUNCTION get_youtube_sources()
RETURNS TABLE(
  id uuid,
  kind text,
  name text,
  url text,
  domain text,
  metadata jsonb,
  last_cursor jsonb
)
LANGUAGE sql
AS $$
  SELECT id, kind, name, url, domain, metadata, last_cursor
  FROM public.sources
  WHERE kind IN ('youtube_channel', 'youtube_search')
  AND (metadata IS NOT NULL);
$$;

-- Update source cursor with quota tracking
CREATE OR REPLACE FUNCTION update_source_cursor(
  source_id uuid,
  new_cursor jsonb
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.sources
  SET last_cursor = new_cursor,
      updated_at = NOW()
  WHERE id = source_id;
$$;
```

## Audio Extraction & Transcription Pipeline

### Content Extraction Module

```typescript
// worker/src/extract/youtube.ts
import { spawn } from 'child_process';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import PgBoss from 'pg-boss';
import { supabaseAdmin } from '../supabase.js';
import { findRawItemsByIds, insertContents, insertStory, findStoryIdByContentHash } from '../db.js';
import { hashText } from '../utils.js';
import { log } from '../log.js';

export async function runYouTubeExtract(jobData: { rawItemIds: string[] }, boss: PgBoss): Promise<void> {
  const rows = await findRawItemsByIds(jobData.rawItemIds || []);
  const youtubeRows = rows.filter((r) => r.kind === 'youtube');

  log('youtube_extract_start', {
    total_items: rows.length,
    youtube_items: youtubeRows.length,
  });

  for (const row of youtubeRows) {
    try {
      const t0 = Date.now();

      // Step 1: Get video metadata (duration, view count)
      const videoMetadata = await getVideoMetadata(row.external_id);

      // Step 2: Extract audio using yt-dlp
      const audioPath = await extractAudio(row.url, row.external_id);

      // Step 3: Transcribe using Whisper
      const { transcript, vttContent, language } = await transcribeAudio(audioPath, row.external_id);

      // Step 4: Store audio and transcript in Supabase Storage
      const [audioUrl, transcriptUrl] = await Promise.all([
        uploadAudio(row.external_id, audioPath),
        uploadTranscript(row.external_id, vttContent),
      ]);

      // Step 5: Create content record
      const contentHash = hashText(transcript);
      const contentId = await insertContents({
        raw_item_id: row.id,
        text: transcript,
        transcript_url: transcriptUrl,
        audio_url: audioUrl,
        content_hash: contentHash,
        lang: language,
        metadata: {
          ...videoMetadata,
          transcript_format: 'vtt',
          audio_format: 'm4a',
          extraction_timestamp: new Date().toISOString(),
        },
      });

      // Step 6: Create or link story
      let storyId = await findStoryIdByContentHash(contentHash);
      if (!storyId) {
        storyId = await insertStory({
          content_id: contentId,
          title: row.title,
          canonical_url: row.url,
          primary_url: row.url,
          kind: 'youtube',
          published_at: row.metadata?.published_at,
          metadata: {
            ...row.metadata,
            ...videoMetadata,
            audio_url: audioUrl,
            transcript_url: transcriptUrl,
          },
        });
      }

      // Step 7: Enqueue for AI analysis
      await boss.send('analyze:llm', { storyId });

      // Step 8: Cleanup temp files
      await cleanupTempFiles([audioPath]);

      const processingTime = Date.now() - t0;
      log('youtube_extract_complete', {
        raw_item_id: row.id,
        story_id: storyId,
        video_id: row.external_id,
        transcript_length: transcript.length,
        transcript_words: transcript.split(/\s+/).length,
        duration_seconds: videoMetadata.duration_seconds,
        processing_time_ms: processingTime,
        language: language,
      });
    } catch (error) {
      log(
        'youtube_extract_error',
        {
          raw_item_id: row.id,
          video_id: row.external_id,
          url: row.url,
          error: String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'error'
      );
    }
  }
}

async function getVideoMetadata(videoId: string): Promise<{
  duration_seconds: number;
  view_count: number;
  like_count?: number;
  comment_count?: number;
}> {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', ['--dump-json', '--no-download', `https://www.youtube.com/watch?v=${videoId}`]);

    let jsonOutput = '';
    ytdlp.stdout.on('data', (data) => {
      jsonOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(jsonOutput);
          resolve({
            duration_seconds: metadata.duration || 0,
            view_count: metadata.view_count || 0,
            like_count: metadata.like_count,
            comment_count: metadata.comment_count,
          });
        } catch (error) {
          reject(new Error(`Failed to parse video metadata: ${error}`));
        }
      } else {
        reject(new Error(`yt-dlp metadata extraction failed with code ${code}`));
      }
    });

    // 30 second timeout for metadata
    setTimeout(() => {
      ytdlp.kill();
      reject(new Error('Video metadata extraction timeout'));
    }, 30_000);
  });
}

async function extractAudio(videoUrl: string, videoId: string): Promise<string> {
  const tempDir = tmpdir();
  const audioFile = join(tempDir, `${videoId}.m4a`);

  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--extract-audio',
      '--audio-format',
      'm4a',
      '--audio-quality',
      '0', // Best quality
      '--output',
      audioFile,
      '--no-playlist',
      '--max-filesize',
      '500M', // Limit file size to 500MB
      videoUrl,
    ]);

    let errorOutput = '';
    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        resolve(audioFile);
      } else {
        reject(new Error(`yt-dlp failed with code ${code}: ${errorOutput}`));
      }
    });

    // 10 minute timeout for audio extraction
    setTimeout(() => {
      ytdlp.kill();
      reject(new Error('Audio extraction timeout (10 minutes)'));
    }, 600_000);
  });
}

async function transcribeAudio(
  audioPath: string,
  videoId: string
): Promise<{
  transcript: string;
  vttContent: string;
  language: string;
}> {
  const tempDir = tmpdir();
  const outputPrefix = join(tempDir, videoId);

  return new Promise((resolve, reject) => {
    const whisper = spawn('whisper', [
      audioPath,
      '--model',
      process.env.WHISPER_MODEL || 'base',
      '--output_format',
      'vtt',
      '--output_dir',
      tempDir,
      '--output_file',
      videoId,
      '--language',
      'auto', // Auto-detect language
      '--task',
      'transcribe',
      '--fp16',
      'False', // Better compatibility
    ]);

    let errorOutput = '';
    whisper.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    whisper.on('close', async (code) => {
      if (code === 0) {
        try {
          const vttFile = `${outputPrefix}.vtt`;
          const vttContent = await fs.readFile(vttFile, 'utf-8');
          const { transcript, language } = extractTextFromVTT(vttContent);

          // Cleanup VTT file
          await fs.unlink(vttFile).catch(() => {});

          resolve({ transcript, vttContent, language });
        } catch (error) {
          reject(new Error(`Failed to read transcription: ${error}`));
        }
      } else {
        reject(new Error(`Whisper failed with code ${code}: ${errorOutput}`));
      }
    });

    // 15 minute timeout for transcription
    setTimeout(() => {
      whisper.kill();
      reject(new Error('Transcription timeout (15 minutes)'));
    }, 900_000);
  });
}

function extractTextFromVTT(vttContent: string): { transcript: string; language: string } {
  const lines = vttContent.split('\n');
  const textLines: string[] = [];
  let language = 'en'; // Default

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extract language from VTT header
    if (line.startsWith('Language:')) {
      language = line.split(':')[1].trim();
      continue;
    }

    // Skip timestamp lines and empty lines
    if (line.includes('-->') || line === '' || line.startsWith('WEBVTT')) {
      continue;
    }

    // Skip speaker labels and formatting
    if (line.match(/^\d+$/) || line.startsWith('<') || line.startsWith('NOTE')) {
      continue;
    }

    textLines.push(line);
  }

  return {
    transcript: textLines.join(' ').replace(/\s+/g, ' ').trim(),
    language,
  };
}

async function uploadAudio(videoId: string, audioPath: string): Promise<string> {
  const fileName = `${videoId}.m4a`;
  const fileBuffer = await fs.readFile(audioPath);

  const { data, error } = await supabaseAdmin.storage.from('youtube-audio').upload(fileName, fileBuffer, {
    contentType: 'audio/mp4',
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  return `youtube-audio/${fileName}`;
}

async function uploadTranscript(
  videoId: string,
  vttContent: string,
  plainText: string
): Promise<{
  vttUrl: string;
  txtUrl: string;
}> {
  const vttFileName = `${videoId}.vtt`;
  const txtFileName = `${videoId}.txt`;

  // Upload VTT file with timestamps
  const { data: vttData, error: vttError } = await supabaseAdmin.storage
    .from('youtube-transcripts')
    .upload(vttFileName, vttContent, {
      contentType: 'text/vtt',
      upsert: true,
      cacheControl: '86400', // Cache for 24 hours
    });

  if (vttError) {
    throw new Error(`Failed to upload VTT transcript: ${vttError.message}`);
  }

  // Upload plain text file for search and AI analysis
  const { data: txtData, error: txtError } = await supabaseAdmin.storage
    .from('youtube-transcripts')
    .upload(txtFileName, plainText, {
      contentType: 'text/plain',
      upsert: true,
      cacheControl: '86400', // Cache for 24 hours
    });

  if (txtError) {
    throw new Error(`Failed to upload plain text transcript: ${txtError.message}`);
  }

  return {
    vttUrl: `youtube-transcripts/${vttFileName}`,
    txtUrl: `youtube-transcripts/${txtFileName}`,
  };
}

async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  await Promise.all(
    filePaths.map((path) =>
      fs.unlink(path).catch((error) => log('temp_file_cleanup_error', { path, error: String(error) }, 'warn'))
    )
  );
}
```

## Database Schema Extensions

### ✅ IMPLEMENTED: Database-First Transcript Storage (Production Ready)

**IMPLEMENTED STRATEGY**: Store VTT content directly in database for optimal performance and cost efficiency.

```sql
-- ✅ COMPLETED: Added transcript storage to contents table (2025-09-05)
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS transcript_vtt text;
CREATE INDEX IF NOT EXISTS idx_contents_transcript_vtt ON public.contents(id) WHERE transcript_vtt IS NOT NULL;
COMMENT ON COLUMN public.contents.transcript_vtt IS 'WebVTT format transcript content for YouTube videos with timestamps';
```

**Database Schema Benefits**:

- **Zero Storage Costs**: No file storage fees for transcript content
- **Atomic Operations**: Transcript and content stored together in single transaction
- **Fast Access**: Direct database queries, no file system overhead
- **Simplified Architecture**: No separate storage bucket management needed
- **Backup Included**: Transcripts included in database backups automatically

**Transcript URL Pattern**:

- Format: `youtube://{videoId}` (stored in `contents.transcript_url`)
- Example: `youtube://dQw4w9WgXcQ`
- Purpose: Frontend identification of YouTube content type

**Implementation Details**:

- **VTT Content**: Stored in `contents.transcript_vtt` field with full WebVTT format
- **Plain Text**: Stored in `contents.text` field for search and AI analysis
- **Metadata**: Video duration, view count stored in dedicated fields
- **Processing**: Audio files processed temporarily, deleted after transcription

## ✅ COMPLETED: Database-First Implementation (2025-09-05)

### ✅ Step 1: Database Schema Updates (COMPLETE)

**Implemented Database Changes:**

```sql
-- ✅ EXECUTED: Added transcript storage to contents table
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS transcript_vtt text;
CREATE INDEX IF NOT EXISTS idx_contents_transcript_vtt ON public.contents(id) WHERE transcript_vtt IS NOT NULL;
COMMENT ON COLUMN public.contents.transcript_vtt IS 'WebVTT format transcript content for YouTube videos with timestamps';
```

### Step 2: Configure RLS Policies (10 minutes)

```sql
-- Execute in Supabase SQL Editor
-- Service role can manage youtube-transcripts
CREATE POLICY "Service role can manage youtube-transcripts" ON storage.objects
FOR ALL USING (bucket_id = 'youtube-transcripts' AND auth.role() = 'service_role');

-- Authenticated users can read transcripts (for frontend internal reader)
CREATE POLICY "Authenticated users can read transcripts" ON storage.objects
FOR SELECT USING (bucket_id = 'youtube-transcripts' AND auth.role() = 'authenticated');
```

### Step 3: Create Storage Upload Module (25 minutes)

Create `worker/src/storage/youtube-uploads.ts`:

```typescript
import { supabaseAdmin } from '../supabase.js';
import { log } from '../log.js';

export interface TranscriptUploadResult {
  vttUrl: string;
  txtUrl: string;
  success: boolean;
  error?: string;
}

export async function uploadYouTubeTranscript(
  videoId: string,
  vttContent: string,
  plainText: string
): Promise<TranscriptUploadResult> {
  try {
    const vttFileName = `${videoId}.vtt`;
    const txtFileName = `${videoId}.txt`;

    log('youtube_transcript_upload_start', {
      videoId,
      vttSize: vttContent.length,
      txtSize: plainText.length,
    });

    // Upload VTT file with timestamps
    const { data: vttData, error: vttError } = await supabaseAdmin.storage
      .from('youtube-transcripts')
      .upload(vttFileName, vttContent, {
        contentType: 'text/vtt',
        upsert: true,
        cacheControl: '86400', // Cache for 24 hours
      });

    if (vttError) {
      throw new Error(`VTT upload failed: ${vttError.message}`);
    }

    // Upload plain text file for search and AI analysis
    const { data: txtData, error: txtError } = await supabaseAdmin.storage
      .from('youtube-transcripts')
      .upload(txtFileName, plainText, {
        contentType: 'text/plain',
        upsert: true,
        cacheControl: '86400', // Cache for 24 hours
      });

    if (txtError) {
      throw new Error(`Plain text upload failed: ${txtError.message}`);
    }

    const result = {
      vttUrl: `youtube-transcripts/${vttFileName}`,
      txtUrl: `youtube-transcripts/${txtFileName}`,
      success: true,
    };

    log('youtube_transcript_upload_success', {
      videoId,
      vttUrl: result.vttUrl,
      txtUrl: result.txtUrl,
    });

    return result;
  } catch (error) {
    const errorMessage = String(error);
    log(
      'youtube_transcript_upload_error',
      {
        videoId,
        error: errorMessage,
      },
      'error'
    );

    return {
      vttUrl: '',
      txtUrl: '',
      success: false,
      error: errorMessage,
    };
  }
}
```

### Step 4: Update Extraction Pipeline (15 minutes)

Modify `worker/src/extract/youtube.ts` to integrate storage upload:

```typescript
// Add import at top of file
import { uploadYouTubeTranscript } from '../storage/youtube-uploads.js';

// Update the extraction pipeline (around line 300-330)
// Replace the content creation section with:

const transcriptText = transcriptionResult.text.trim();
if (!transcriptText) {
  throw new Error('No text extracted from transcription');
}

// Upload transcripts to storage
const uploadResult = await uploadYouTubeTranscript(
  videoId,
  transcriptionResult.vtt || '', // VTT content with timestamps
  transcriptText // Plain text for search
);

if (!uploadResult.success) {
  throw new Error(`Transcript upload failed: ${uploadResult.error}`);
}

const enhancedText = formatYouTubeContent(transcriptText, audioResult.metadata, transcriptionResult);
const content_hash = hashText(enhancedText);

const content_id = await insertContents({
  raw_item_id: row.id,
  text: enhancedText,
  html_url: videoUrl,
  transcript_url: uploadResult.vttUrl, // Store VTT URL for frontend
  lang: transcriptionResult.language,
  content_hash,
});
```

## Frontend Integration Specifications

### Stories Feed Integration

**Requirement**: YouTube content appears in main stories feed alongside articles

**Implementation Details**:

- Update `src/features/stories/controllers/stories.ts` to fetch YouTube content
- Filter stories by `contents.transcript_url LIKE 'youtube://%'` for YouTube identification
- Display video metadata in story cards (title, channel, duration, view count)
- Add YouTube branding and thumbnail display
- Maintain chronological ordering with article stories

**Database Query Pattern**:

```sql
-- Fetch YouTube stories with transcript data
SELECT
  s.id, s.title, s.canonical_url, s.created_at,
  c.transcript_url, c.transcript_vtt, c.duration_seconds, c.view_count
FROM stories s
JOIN contents c ON c.id = s.content_id
WHERE c.transcript_url LIKE 'youtube://%'
ORDER BY s.created_at DESC;
```

### Story Detail View Layout

**Layout Requirements**:

- **Left Side (60% width)**: YouTube video iframe embed with responsive sizing
- **Right Sidebar (40% width)**: "Why It Matters" section above existing content
- **Main Content Area**: Internal transcript reader with full VTT content
- **Mobile**: Stack vertically (video → transcript → sidebar)

**YouTube Iframe Integration**:

```typescript
// Extract video ID from transcript_url pattern
const videoId = transcriptUrl.replace('youtube://', '');
const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;

// Enable YouTube Player API for timestamp synchronization
<iframe
  src={embedUrl}
  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
  allowFullScreen
  className='aspect-video w-full'
/>;
```

### Internal Transcript Reader

**Core Features**:

1. **VTT Parsing**: Parse `contents.transcript_vtt` field to extract timestamps and text
2. **Clickable Timestamps**: Click timestamp to seek video to specific time
3. **Auto-Scroll**: Highlight current segment based on video playback
4. **Search**: Find text within transcript with highlighting
5. **Responsive Design**: Mobile-friendly transcript display

**VTT Parsing Implementation**:

```typescript
interface TranscriptSegment {
  id: number;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  startTimeFormatted: string; // "MM:SS"
  endTimeFormatted: string;
}

function parseVTT(vttContent: string): TranscriptSegment[] {
  // Parse WebVTT format from contents.transcript_vtt
  // Extract timestamps and text segments
  // Return structured data for UI rendering
}
```

**Video Synchronization**:

```typescript
// YouTube Player API integration
function seekToTimestamp(seconds: number) {
  if (youtubePlayer) {
    youtubePlayer.seekTo(seconds, true);
  }
}

// Auto-highlight current segment
function updateCurrentSegment(currentTime: number) {
  const activeSegment = segments.find((s) => currentTime >= s.startTime && currentTime <= s.endTime);
  setActiveSegmentId(activeSegment?.id);
}
```

## AI Analysis Enhancement Specifications

### "Why It Matters" Analysis for YouTube Content

**Objective**: Extract key insights specifically valuable to AI researchers and software engineers

**Analysis Prompt Template**:

```
Analyze this YouTube video transcript and extract 3-5 key insights that matter most to AI researchers and software engineers. Focus on:

1. **Research Significance**: How does this advance current AI/ML research?
2. **Practical Applications**: What real-world problems does this solve?
3. **Technical Innovation**: What new techniques or approaches are introduced?
4. **Industry Impact**: How might this influence AI development practices?
5. **Implementation Relevance**: What can engineers apply immediately?

Format as bullet points with specific, actionable insights. Avoid generic summaries.

Transcript: {transcript_text}
Video Metadata: Title: {title}, Channel: {channel}, Duration: {duration}
```

**Output Format**:

```json
{
  "why_it_matters": [
    "• Introduces novel attention mechanism that reduces transformer memory usage by 40% while maintaining accuracy",
    "• Demonstrates practical implementation for production ML systems handling 1M+ requests/day",
    "• Provides open-source framework that can be integrated into existing PyTorch workflows",
    "• Addresses critical scalability challenges in large language model deployment",
    "• Shows measurable improvements in inference speed for real-time applications"
  ]
}
```

### "Technical Stack/Tools" Analysis

**Objective**: Identify and timestamp all technologies, frameworks, and tools mentioned

**Analysis Prompt Template**:

```
Extract all technical tools, frameworks, programming languages, cloud platforms, and methodologies mentioned in this YouTube video transcript. For each item:

1. Provide the exact name/term used
2. Include precise timestamp where mentioned (format: [MM:SS])
3. Add brief context about how it's used
4. Categorize by type (ML Framework, Cloud Platform, Programming Language, etc.)

Be comprehensive - include libraries, APIs, services, algorithms, and development tools.

Transcript with timestamps: {transcript_with_timestamps}
```

**Output Format**:

```json
{
  "technical_stack": {
    "ml_frameworks": [
      "PyTorch - [03:45] Used for model training and inference pipeline",
      "Transformers - [07:22] Hugging Face library for pre-trained models"
    ],
    "cloud_platforms": [
      "AWS SageMaker - [12:30] Model deployment and scaling infrastructure",
      "Google Cloud TPU - [15:18] Hardware acceleration for training"
    ],
    "programming_languages": [
      "Python - [02:15] Primary development language for ML pipeline",
      "CUDA - [09:33] GPU programming for custom kernels"
    ],
    "development_tools": [
      "Docker - [18:45] Containerization for model serving",
      "Kubernetes - [20:12] Orchestration for distributed training"
    ]
  }
}
```

### Enhanced Content Analysis (Future)

**Additional Analysis Types**:

1. **Key Concepts**: Extract main technical concepts and definitions with timestamps
2. **Research Papers**: Identify and link mentioned academic papers
3. **Code Examples**: Capture specific implementation details and architectural patterns
4. **Future Implications**: Analyze potential impact on industry and research directions

**Database Schema Extensions**:

```sql
-- Additional fields for enhanced analysis
ALTER TABLE story_overlays ADD COLUMN IF NOT EXISTS technical_stack jsonb;
ALTER TABLE story_overlays ADD COLUMN IF NOT EXISTS key_concepts jsonb;
ALTER TABLE story_overlays ADD COLUMN IF NOT EXISTS research_papers jsonb;
ALTER TABLE story_overlays ADD COLUMN IF NOT EXISTS implementation_details jsonb;
```

### Database Schema Updates

```sql
-- Add YouTube-specific fields to contents table
ALTER TABLE public.contents
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS transcript_url text,
ADD COLUMN IF NOT EXISTS duration_seconds integer,
ADD COLUMN IF NOT EXISTS view_count bigint;

-- Add indexes for YouTube content queries
CREATE INDEX IF NOT EXISTS idx_contents_audio_url ON public.contents(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contents_transcript_url ON public.contents(transcript_url) WHERE transcript_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_raw_items_youtube ON public.raw_items(kind, external_id) WHERE kind = 'youtube';

-- Add YouTube source validation
ALTER TABLE public.sources
ADD CONSTRAINT check_youtube_metadata
CHECK (
  (kind NOT IN ('youtube_channel', 'youtube_search')) OR
  (metadata IS NOT NULL AND metadata != '{}')
);
```

## Worker Integration

### Updated Worker Main Module

```typescript
// worker/src/worker.ts - YouTube integration
import { runIngestYouTube } from './ingest/youtube.js';
import { runYouTubeExtract } from './extract/youtube.js';

// Add YouTube scheduling (every 10 minutes, offset from RSS)
await boss.schedule('ingest:pull', '5,15,25,35,45,55 * * * *', { source: 'youtube' }, { tz: CRON_TZ });

// Update ingest:pull worker to handle YouTube
await boss.work('ingest:pull', { teamSize: 1, teamConcurrency: 1 }, async (jobs) => {
  for (const job of jobs) {
    const { source } = (job.data || {}) as { source?: string };
    log('ingest_pull_start', { jobId: job.id, source });

    try {
      if (source === 'rss') {
        await runIngestRss(boss);
      } else if (source === 'youtube') {
        await runIngestYouTube(boss);
      } else {
        log('unknown_source_type', { source }, 'warn');
      }

      await boss.complete('ingest:pull', job.id);
      log('ingest_pull_done', { jobId: job.id, source });
    } catch (error) {
      log(
        'ingest_pull_error',
        {
          jobId: job.id,
          source,
          error: String(error),
        },
        'error'
      );
      await boss.fail('ingest:pull', job.id, error);
    }
  }
});

// Update ingest:fetch-content worker to handle YouTube
await boss.work('ingest:fetch-content', { teamSize: 2, teamConcurrency: 1 }, async (jobs) => {
  for (const job of jobs) {
    const jobData = job.data as { rawItemIds: string[] };
    log('fetch_content_start', { jobId: job.id, rawItemCount: jobData.rawItemIds?.length });

    try {
      // Process YouTube videos separately from articles
      const rawItems = await findRawItemsByIds(jobData.rawItemIds || []);
      const youtubeItems = rawItems.filter((item) => item.kind === 'youtube');
      const articleItems = rawItems.filter((item) => item.kind !== 'youtube');

      // Process YouTube videos with transcription
      if (youtubeItems.length > 0) {
        await runYouTubeExtract({ rawItemIds: youtubeItems.map((item) => item.id) }, boss);
      }

      // Process articles with existing extraction
      if (articleItems.length > 0) {
        await runExtract({ rawItemIds: articleItems.map((item) => item.id) }, boss);
      }

      await boss.complete('ingest:fetch-content', job.id);
      log('fetch_content_done', {
        jobId: job.id,
        youtube_items: youtubeItems.length,
        article_items: articleItems.length,
      });
    } catch (error) {
      log(
        'fetch_content_error',
        {
          jobId: job.id,
          error: String(error),
        },
        'error'
      );
      await boss.fail('ingest:fetch-content', job.id, error);
    }
  }
});
```

## AI Analysis Integration

### Enhanced LLM Analysis for YouTube

```typescript
// worker/src/analyze/llm.ts - YouTube-specific analysis
const YOUTUBE_ANALYSIS_PROMPT = `
You are analyzing a YouTube video transcript. Provide a comprehensive analysis considering the video format and speaker context.

Video Title: {title}
Channel: {channel_title}
Duration: {duration_minutes} minutes
View Count: {view_count}
Published: {published_date}

Transcript:
{transcript}

Provide your analysis in this exact JSON format:
{
  "why_it_matters": "3-5 bullet points explaining why this video content is significant, considering speaker expertise, information novelty, and potential impact",
  "chili": 0-5, // Importance score: 0=not important, 5=extremely important/trending
  "confidence": 0.0-1.0, // Confidence in analysis based on content quality, speaker authority, and transcript clarity
  "citations": [
    {
      "title": "Source or reference mentioned in video",
      "url": "URL if mentioned, otherwise video URL",
      "domain": "domain.com",
      "timestamp": "MM:SS if specific moment referenced"
    }
  ]
}

Consider:
- Speaker expertise and channel authority
- Information novelty and exclusivity
- Production quality and content depth
- Potential audience impact and shareability
- Technical accuracy and evidence quality
`;

// Enhanced analysis function for YouTube content
async function analyzeYouTubeContent(story: StoryRow, content: ContentRow): Promise<AnalysisResult> {
  const metadata = story.metadata as any;
  const durationMinutes = Math.round((metadata.duration_seconds || 0) / 60);
  const publishedDate = story.published_at ? new Date(story.published_at).toLocaleDateString() : 'Unknown';

  const prompt = YOUTUBE_ANALYSIS_PROMPT.replace('{title}', story.title || 'Untitled Video')
    .replace('{channel_title}', metadata.channel_title || 'Unknown Channel')
    .replace('{duration_minutes}', durationMinutes.toString())
    .replace('{view_count}', (metadata.view_count || 0).toLocaleString())
    .replace('{published_date}', publishedDate)
    .replace('{transcript}', content.text.slice(0, 8000)); // Limit for token constraints

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const analysisText = response.choices[0]?.message?.content;
  if (!analysisText) {
    throw new Error('No analysis content returned from OpenAI');
  }

  return parseAnalysisResponse(analysisText);
}

// Update main analysis function to handle YouTube
export async function runAnalyzeLLM(jobData: { storyId: string }, boss: PgBoss): Promise<void> {
  const story = await findStoryById(jobData.storyId);
  if (!story) {
    throw new Error(`Story not found: ${jobData.storyId}`);
  }

  const content = await findContentByStoryId(story.id);
  if (!content) {
    throw new Error(`Content not found for story: ${story.id}`);
  }

  let analysis: AnalysisResult;

  // Use YouTube-specific analysis for video content
  if (story.kind === 'youtube') {
    analysis = await analyzeYouTubeContent(story, content);
  } else {
    analysis = await analyzeArticleContent(story, content);
  }

  // Store analysis results
  await insertStoryOverlay({
    story_id: story.id,
    why_it_matters: analysis.why_it_matters,
    chili: analysis.chili,
    confidence: analysis.confidence,
    citations: analysis.citations,
  });

  // Generate embeddings for transcript/content
  await boss.send('analyze:embed', { storyId: story.id });

  log('llm_analysis_complete', {
    story_id: story.id,
    kind: story.kind,
    chili: analysis.chili,
    confidence: analysis.confidence,
    citations_count: analysis.citations.length,
  });
}
```

## Deployment & Infrastructure

### Environment Configuration

```bash
# worker/.env additions for YouTube pipeline
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
YOUTUBE_QUOTA_LIMIT=10000
YOUTUBE_QUOTA_RESET_HOUR=0  # UTC hour when quota resets
WHISPER_MODEL=base  # Options: tiny, base, small, medium, large
YTDLP_PATH=/usr/local/bin/yt-dlp
WHISPER_PATH=/usr/local/bin/whisper
MAX_VIDEO_DURATION=7200  # 2 hours in seconds
MAX_AUDIO_FILE_SIZE=524288000  # 500MB in bytes
```

### Docker Configuration

```dockerfile
# worker/Dockerfile additions
FROM node:18-slim

# Install system dependencies for YouTube processing
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp and Whisper
RUN pip3 install --no-cache-dir \
    yt-dlp==2024.1.7 \
    openai-whisper==20231117 \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Verify installations
RUN yt-dlp --version && whisper --help

# Set working directory and copy application
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Create temp directory with proper permissions
RUN mkdir -p /tmp/youtube-processing && chmod 777 /tmp/youtube-processing

EXPOSE 3000
CMD ["npm", "start"]
```

### Cloud Run Configuration

```bash
# Deploy with increased resources for video processing
gcloud run deploy zeke-worker \
  --image gcr.io/your-project/zeke-worker \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 1800 \
  --concurrency 1 \
  --max-instances 3 \
  --set-env-vars YOUTUBE_API_KEY=$YOUTUBE_API_KEY,WHISPER_MODEL=base \
  --set-env-vars MAX_VIDEO_DURATION=7200,MAX_AUDIO_FILE_SIZE=524288000
```

## Monitoring & Observability

### Key Metrics to Track

```typescript
// Enhanced logging for YouTube pipeline monitoring
interface YouTubeMetrics {
  // Ingestion metrics
  videos_discovered: number;
  videos_processed: number;
  quota_used: number;
  quota_remaining: number;

  // Processing metrics
  avg_extraction_time_ms: number;
  avg_transcription_time_ms: number;
  avg_transcript_length: number;
  avg_video_duration_seconds: number;

  // Quality metrics
  transcription_success_rate: number;
  analysis_success_rate: number;
  avg_confidence_score: number;

  // Error metrics
  extraction_failures: number;
  transcription_failures: number;
  quota_exceeded_events: number;
}

// Dashboard queries for monitoring
const YOUTUBE_DASHBOARD_QUERIES = {
  // Daily ingestion summary
  daily_summary: `
    SELECT
      DATE(discovered_at) as date,
      COUNT(*) FILTER (WHERE kind = 'youtube') as youtube_videos,
      COUNT(*) FILTER (WHERE kind != 'youtube') as other_content,
      AVG(LENGTH(contents.text)) FILTER (WHERE raw_items.kind = 'youtube') as avg_transcript_length
    FROM raw_items
    LEFT JOIN contents ON contents.raw_item_id = raw_items.id
    WHERE discovered_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(discovered_at)
    ORDER BY date DESC;
  `,

  // YouTube processing performance
  processing_performance: `
    SELECT
      s.kind,
      COUNT(*) as stories_count,
      AVG(so.chili) as avg_chili,
      AVG(so.confidence) as avg_confidence,
      COUNT(so.id) as analyzed_count,
      COUNT(se.id) as embedded_count
    FROM stories s
    LEFT JOIN story_overlays so ON so.story_id = s.id
    LEFT JOIN story_embeddings se ON se.story_id = s.id
    WHERE s.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY s.kind;
  `,

  // Quota usage tracking
  quota_usage: `
    SELECT
      s.name,
      s.kind,
      (s.last_cursor->>'quotaUsed')::int as quota_used,
      s.last_cursor->>'lastSuccessfulRun' as last_run,
      (s.last_cursor->>'videosProcessed')::int as videos_processed
    FROM sources s
    WHERE s.kind IN ('youtube_channel', 'youtube_search')
    ORDER BY quota_used DESC;
  `,
};
```

### Error Handling & Recovery

```typescript
// Robust error handling for YouTube pipeline
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

// Retry logic with exponential backoff
async function withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

function isRetryableError(error: any): boolean {
  if (error instanceof YouTubeProcessingError) {
    return error.retryable;
  }

  // Network errors are generally retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // YouTube API rate limit errors
  if (error.message?.includes('quotaExceeded')) {
    return false; // Don't retry quota errors
  }

  return false;
}
```

## Implementation Timeline & Milestones

### Phase 1: Foundation (Week 1)

- ✅ **Day 1-2**: YouTube Data API integration and quota management
- ✅ **Day 3-4**: Channel-based video discovery and metadata extraction
- ✅ **Day 5-7**: Database schema updates and storage bucket setup

### Phase 2: Core Processing (Week 2)

- ✅ **Day 8-10**: yt-dlp audio extraction pipeline
- ✅ **Day 11-13**: Whisper transcription integration
- ✅ **Day 14**: Supabase Storage integration for audio/transcripts

### Phase 3: Analysis & Integration (Week 3)

- ✅ **Day 15-17**: Enhanced LLM analysis for video content
- ✅ **Day 18-19**: Search-based discovery implementation
- ✅ **Day 20-21**: Monitoring, error handling, and performance optimization

### Expected Impact Metrics

**Content Volume Increase:**

- Current: ~47 raw items/day (2 RSS sources)
- Target: ~500+ raw items/day (2 RSS + 10 YouTube channels + 5 search queries)
- **10x content volume increase**

**Content Diversity:**

- Add video/podcast content alongside articles
- Multi-language content support (auto-detected)
- Rich metadata (view counts, duration, channel authority)

**AI Analysis Enhancement:**

- Speaker context and channel authority in analysis
- Video-specific confidence scoring
- Timestamp-based citations for video references

**User Experience:**

- Searchable video transcripts in internal reader
- Audio playback with transcript synchronization
- Video content clustering with articles on similar topics

This comprehensive YouTube ingestion specification provides a complete roadmap for implementing video content processing within the existing ZEKE pipeline architecture, ensuring seamless integration while dramatically expanding content volume and diversity.
