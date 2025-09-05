# Apple Podcasts Ingestion Pipeline Specification

**Status**: Planning Phase  
**Priority**: High Impact - Smart content deduplication and quality improvement  
**Dependencies**: Apple Podcasts API, RSS parsing, Whisper transcription, content matching algorithms

This document specifies the complete implementation of Apple Podcasts ingestion for the ZEKE pipeline, including intelligent cross-platform content linking, deduplication, and enhanced audio processing.

## Architecture Overview

The podcast ingestion pipeline extends ZEKE's existing architecture with smart content management:

1. **Multi-Source Discovery**: Apple Podcasts API + RSS feeds for comprehensive episode discovery
2. **Content Matching**: Intelligent algorithms to link podcast episodes with existing YouTube videos
3. **Quality-First Processing**: Prioritize high-quality podcast audio for transcription
4. **Unified Experience**: Serve video players with podcast-quality transcripts
5. **Deduplication**: Prevent redundant processing of cross-platform content

## Apple Podcasts API Integration

### Authentication & Setup

```bash
# Required environment variables
APPLE_PODCASTS_API_KEY=your_apple_podcasts_api_key
APPLE_PODCASTS_RATE_LIMIT=1000  # Requests per hour
APPLE_PODCASTS_SEARCH_LIMIT=200  # Search results per request
RSS_FETCH_TIMEOUT=30000  # 30 seconds timeout for RSS feeds
```

### API Endpoints & Rate Limits

- **Search API**: 1,000 requests/hour for podcast discovery
- **Lookup API**: 1,000 requests/hour for episode details
- **RSS Feeds**: No rate limits, but implement respectful crawling (5-second delays)

### Rate Limiting Strategy

```typescript
interface PodcastRateLimit {
  hourlyUsed: number;
  hourlyLimit: number;
  lastReset: string;
  requestQueue: Array<{
    endpoint: string;
    params: any;
    timestamp: number;
  }>;
}

// Rate limiting with queue management
class ApplePodcastsClient {
  private rateLimiter: PodcastRateLimit;

  async searchPodcasts(term: string): Promise<PodcastSearchResult[]> {
    await this.checkRateLimit();
    // Implementation with exponential backoff
  }

  async getPodcastEpisodes(podcastId: string): Promise<PodcastEpisode[]> {
    await this.checkRateLimit();
    // Implementation with caching
  }
}
```

## Source Configuration & Discovery

### Podcast Source Types

```sql
-- Podcast-specific source configurations
INSERT INTO public.sources (kind, name, url, domain, metadata) VALUES
-- Apple Podcasts API sources (for discovery)
('podcast_show', 'Lex Fridman Podcast', 'https://podcasts.apple.com/us/podcast/the-lex-fridman-podcast/id1434243584', 'podcasts.apple.com',
 '{
   "apple_podcast_id": "1434243584",
   "rss_url": "https://lexfridman.com/feed/podcast/",
   "category": "ai_research",
   "priority": "high",
   "max_episodes_per_run": 5,
   "youtube_channel_id": "UCSHZKyawb77ixDdsGog4iWA",
   "host_name": "Lex Fridman",
   "typical_duration_minutes": 180
 }'),

('podcast_show', 'Huberman Lab', 'https://podcasts.apple.com/us/podcast/huberman-lab/id1545953110', 'podcasts.apple.com',
 '{
   "apple_podcast_id": "1545953110",
   "rss_url": "https://feeds.megaphone.fm/hubermanlab",
   "category": "health_science",
   "priority": "high",
   "max_episodes_per_run": 3,
   "youtube_channel_id": "UC2D2CMWXMOVWx7giW1n3LIg",
   "host_name": "Andrew Huberman",
   "typical_duration_minutes": 120
 }'),

-- RSS-only sources (for podcasts without Apple Podcasts presence)
('podcast_rss', 'AI Alignment Podcast', 'https://feeds.soundcloud.com/users/soundcloud:users:390172906/sounds.rss', 'soundcloud.com',
 '{
   "category": "ai_research",
   "priority": "medium",
   "max_episodes_per_run": 10,
   "host_name": "Various",
   "typical_duration_minutes": 60
 }');
```

### Enhanced Cursor Management

```typescript
interface PodcastCursor {
  // Episode tracking
  lastEpisodeGuid?: string; // RSS GUID for deduplication
  lastPublishedDate?: string; // ISO timestamp for incremental fetching
  lastAppleEpisodeId?: string; // Apple Podcasts episode ID

  // Content matching tracking
  matchedEpisodes?: number; // Episodes matched with YouTube videos
  duplicatesSkipped?: number; // Episodes skipped due to existing content

  // Processing metrics
  episodesProcessed?: number;
  avgProcessingTimeMs?: number;
  transcriptionSuccessRate?: number;

  // API usage tracking
  apiCallsUsed?: number;
  rssLastFetched?: string;
  lastSuccessfulRun?: string;
}
```

## Content Matching & Deduplication

### Intelligent Content Matching Algorithm

```typescript
// worker/src/matching/content-matcher.ts
interface ContentMatch {
  confidence: number; // 0-1 confidence score
  matchType: 'exact' | 'fuzzy' | 'metadata' | 'duration';
  existingStoryId: string;
  existingContentId: string;
  reasons: string[]; // Why this match was made
}

class ContentMatcher {
  async findMatchingContent(podcastEpisode: PodcastEpisode): Promise<ContentMatch | null> {
    // 1. Exact title matching (normalized)
    const exactMatch = await this.findExactTitleMatch(podcastEpisode);
    if (exactMatch) return exactMatch;

    // 2. Fuzzy title matching with duration validation
    const fuzzyMatch = await this.findFuzzyTitleMatch(podcastEpisode);
    if (fuzzyMatch && this.validateDurationMatch(podcastEpisode, fuzzyMatch)) {
      return fuzzyMatch;
    }

    // 3. Metadata-based matching (publication date + channel)
    const metadataMatch = await this.findMetadataMatch(podcastEpisode);
    if (metadataMatch) return metadataMatch;

    return null;
  }

  private async findExactTitleMatch(episode: PodcastEpisode): Promise<ContentMatch | null> {
    const normalizedTitle = this.normalizeTitle(episode.title);

    const { data: stories } = await supabaseAdmin
      .from('stories')
      .select('id, title, kind, metadata, contents(id)')
      .ilike('title', `%${normalizedTitle}%`)
      .in('kind', ['youtube', 'article'])
      .limit(10);

    for (const story of stories || []) {
      const storyTitleNormalized = this.normalizeTitle(story.title);
      const similarity = this.calculateStringSimilarity(normalizedTitle, storyTitleNormalized);

      if (similarity > 0.95) {
        // 95% similarity threshold
        return {
          confidence: similarity,
          matchType: 'exact',
          existingStoryId: story.id,
          existingContentId: story.contents[0]?.id,
          reasons: [`Exact title match (${Math.round(similarity * 100)}% similarity)`],
        };
      }
    }

    return null;
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[#\d+\-\|\(\)]/g, '') // Remove episode numbers, separators
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private validateDurationMatch(episode: PodcastEpisode, match: ContentMatch): boolean {
    // Duration should be within 10% or 5 minutes (whichever is larger)
    const podcastDuration = episode.duration_seconds;
    const existingDuration = match.metadata?.duration_seconds;

    if (!podcastDuration || !existingDuration) return true; // Skip validation if no duration

    const durationDiff = Math.abs(podcastDuration - existingDuration);
    const allowedDiff = Math.max(podcastDuration * 0.1, 300); // 10% or 5 minutes

    return durationDiff <= allowedDiff;
  }
}
```

### Content Hash-Based Deduplication

```typescript
// Enhanced content hashing for cross-platform deduplication
function generateContentFingerprint(content: {
  title: string;
  duration_seconds?: number;
  published_date?: string;
  host_name?: string;
}): string {
  const normalizedTitle = content.title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const durationBucket = content.duration_seconds
    ? Math.floor(content.duration_seconds / 300) * 300 // 5-minute buckets
    : 0;

  const dateBucket = content.published_date
    ? content.published_date.split('T')[0] // Date only, ignore time
    : '';

  const fingerprint = `${normalizedTitle}|${durationBucket}|${dateBucket}|${content.host_name || ''}`;

  return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
}
```

## Worker Implementation

### Podcast Ingestion Module

```typescript
// worker/src/ingest/podcasts.ts
import Parser from 'rss-parser';
import PgBoss from 'pg-boss';
import { ContentMatcher } from '../matching/content-matcher.js';
import { ApplePodcastsClient } from '../clients/apple-podcasts.js';
import { getPodcastSources, upsertRawItem, updateSourceCursor } from '../db.js';
import { log } from '../log.js';

const rssParser = new Parser({
  customFields: {
    item: [
      ['itunes:duration', 'duration'],
      ['itunes:episode', 'episodeNumber'],
      ['itunes:season', 'seasonNumber'],
      ['itunes:explicit', 'explicit'],
    ],
  },
});

const applePodcasts = new ApplePodcastsClient();
const contentMatcher = new ContentMatcher();

export async function runIngestPodcasts(boss: PgBoss): Promise<void> {
  const sources = await getPodcastSources();
  let totalProcessed = 0;

  for (const source of sources) {
    try {
      const processed = await processPodcastSource(source, boss);
      totalProcessed += processed;
    } catch (error) {
      log(
        'podcast_source_error',
        {
          source_id: source.id,
          source_kind: source.kind,
          error: String(error),
        },
        'error'
      );
    }
  }

  log('podcast_ingestion_complete', {
    sources_processed: sources.length,
    episodes_processed: totalProcessed,
  });
}

async function processPodcastSource(source: SourceRow, boss: PgBoss): Promise<number> {
  if (source.kind === 'podcast_show') {
    return await ingestPodcastShow(source, boss);
  } else if (source.kind === 'podcast_rss') {
    return await ingestRSSFeed(source, boss);
  }
  return 0;
}

async function ingestPodcastShow(source: SourceRow, boss: PgBoss): Promise<number> {
  const metadata = source.metadata as any;
  const cursor = (source.last_cursor as PodcastCursor) || {};

  log('podcast_show_start', {
    source_id: source.id,
    apple_podcast_id: metadata.apple_podcast_id,
    last_episode: cursor.lastEpisodeGuid,
  });

  // Fetch episodes from RSS feed (more reliable than Apple API)
  const rssUrl = metadata.rss_url;
  if (!rssUrl) {
    throw new Error(`No RSS URL configured for podcast show: ${source.name}`);
  }

  const feed = await rssParser.parseURL(rssUrl);
  const maxEpisodes = metadata.max_episodes_per_run || 5;

  let newCount = 0;
  let matchedCount = 0;
  let duplicatesSkipped = 0;

  // Process episodes in reverse chronological order
  const episodes = feed.items
    .sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime())
    .slice(0, maxEpisodes);

  for (const episode of episodes) {
    try {
      // Skip if we've already processed this episode
      if (cursor.lastEpisodeGuid === episode.guid) break;

      // Check for existing content matches
      const podcastEpisode = transformRSSEpisode(episode, metadata);
      const existingMatch = await contentMatcher.findMatchingContent(podcastEpisode);

      if (existingMatch && existingMatch.confidence > 0.8) {
        // Update existing story to link podcast version
        await linkPodcastToExistingStory(existingMatch.existingStoryId, podcastEpisode);
        matchedCount++;

        log('podcast_episode_matched', {
          source_id: source.id,
          episode_title: episode.title,
          existing_story_id: existingMatch.existingStoryId,
          match_confidence: existingMatch.confidence,
          match_type: existingMatch.matchType,
        });
        continue;
      }

      // Create new raw item for unmatched episodes
      const rawItemId = await upsertRawItem({
        source_id: source.id,
        external_id: episode.guid || episode.link || '',
        url: episode.link || '',
        title: episode.title || null,
        kind: 'podcast',
        metadata: {
          ...podcastEpisode,
          show_name: feed.title,
          show_description: feed.description,
          apple_podcast_id: metadata.apple_podcast_id,
          youtube_channel_id: metadata.youtube_channel_id,
          host_name: metadata.host_name,
        },
      });

      if (rawItemId) {
        await boss.send('ingest:fetch-content', { rawItemIds: [rawItemId] });
        newCount++;
      }
    } catch (error) {
      log(
        'podcast_episode_error',
        {
          source_id: source.id,
          episode_title: episode.title,
          error: String(error),
        },
        'error'
      );
    }
  }

  // Update cursor
  const latestEpisode = episodes[0];
  if (latestEpisode) {
    await updateSourceCursor(source.id, {
      lastEpisodeGuid: latestEpisode.guid,
      lastPublishedDate: latestEpisode.pubDate,
      episodesProcessed: newCount,
      matchedEpisodes: matchedCount,
      duplicatesSkipped: duplicatesSkipped,
      lastSuccessfulRun: new Date().toISOString(),
    });
  }

  log('podcast_show_complete', {
    source_id: source.id,
    episodes_found: episodes.length,
    episodes_new: newCount,
    episodes_matched: matchedCount,
    duplicates_skipped: duplicatesSkipped,
  });

  return newCount;
}

function transformRSSEpisode(episode: any, showMetadata: any): PodcastEpisode {
  return {
    guid: episode.guid,
    title: episode.title,
    description: episode.contentSnippet || episode.content,
    published_date: episode.pubDate,
    duration_seconds: parseDuration(episode.duration),
    audio_url: episode.enclosure?.url,
    episode_number: episode.episodeNumber,
    season_number: episode.seasonNumber,
    explicit: episode.explicit === 'true',
    host_name: showMetadata.host_name,
    show_name: showMetadata.name,
  };
}

function parseDuration(duration: string | number): number {
  if (typeof duration === 'number') return duration;
  if (!duration) return 0;

  // Handle formats like "1:23:45" or "83:45" or "3825"
  const parts = duration.toString().split(':').map(Number);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // H:M:S
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // M:S
  } else {
    return parseInt(duration.toString()) || 0; // Seconds
  }
}

async function linkPodcastToExistingStory(storyId: string, podcastEpisode: PodcastEpisode): Promise<void> {
  // Update existing story metadata to include podcast information
  const { error } = await supabaseAdmin
    .from('stories')
    .update({
      metadata: supabaseAdmin.raw(`
        metadata || jsonb_build_object(
          'podcast_audio_url', '${podcastEpisode.audio_url}',
          'podcast_guid', '${podcastEpisode.guid}',
          'podcast_duration', ${podcastEpisode.duration_seconds},
          'has_podcast_version', true
        )
      `),
    })
    .eq('id', storyId);

  if (error) {
    throw new Error(`Failed to link podcast to story ${storyId}: ${error.message}`);
  }
}
```

## Audio Processing & Transcription

### Enhanced Podcast Audio Processing

```typescript
// worker/src/extract/podcasts.ts
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import PgBoss from 'pg-boss';
import { supabaseAdmin } from '../supabase.js';
import { findRawItemsByIds, insertContents, insertStory, findStoryIdByContentHash } from '../db.js';
import { hashText } from '../utils.js';
import { log } from '../log.js';

export async function runPodcastExtract(jobData: { rawItemIds: string[] }, boss: PgBoss): Promise<void> {
  const rows = await findRawItemsByIds(jobData.rawItemIds || []);
  const podcastRows = rows.filter((r) => r.kind === 'podcast');

  log('podcast_extract_start', {
    total_items: rows.length,
    podcast_items: podcastRows.length,
  });

  for (const row of podcastRows) {
    try {
      const t0 = Date.now();

      // Step 1: Download high-quality podcast audio
      const audioPath = await downloadPodcastAudio(row.metadata.audio_url, row.external_id);

      // Step 2: Transcribe using Whisper with podcast-optimized settings
      const { transcript, vttContent, language } = await transcribePodcastAudio(audioPath, row.external_id);

      // Step 3: Store audio and transcript in Supabase Storage
      const [audioUrl, transcriptUrl] = await Promise.all([
        uploadPodcastAudio(row.external_id, audioPath),
        uploadPodcastTranscript(row.external_id, vttContent),
      ]);

      // Step 4: Create content record with podcast-specific metadata
      const contentHash = hashText(transcript);
      const contentId = await insertContents({
        raw_item_id: row.id,
        text: transcript,
        transcript_url: transcriptUrl,
        audio_url: audioUrl,
        content_hash: contentHash,
        lang: language,
        metadata: {
          ...row.metadata,
          transcript_format: 'vtt',
          audio_format: 'mp3',
          source_type: 'podcast',
          extraction_timestamp: new Date().toISOString(),
          audio_quality: 'high', // Podcast audio typically higher quality than YouTube
        },
      });

      // Step 5: Create or update story
      let storyId = await findStoryIdByContentHash(contentHash);
      if (!storyId) {
        storyId = await insertStory({
          content_id: contentId,
          title: row.title,
          canonical_url: row.url,
          primary_url: row.url,
          kind: 'podcast',
          published_at: row.metadata?.published_date,
          metadata: {
            ...row.metadata,
            audio_url: audioUrl,
            transcript_url: transcriptUrl,
            content_source: 'podcast',
          },
        });
      }

      // Step 6: Enqueue for AI analysis
      await boss.send('analyze:llm', { storyId });

      // Step 7: Cleanup temp files
      await cleanupTempFiles([audioPath]);

      const processingTime = Date.now() - t0;
      log('podcast_extract_complete', {
        raw_item_id: row.id,
        story_id: storyId,
        episode_guid: row.external_id,
        transcript_length: transcript.length,
        transcript_words: transcript.split(/\s+/).length,
        duration_seconds: row.metadata?.duration_seconds,
        processing_time_ms: processingTime,
        language: language,
      });
    } catch (error) {
      log(
        'podcast_extract_error',
        {
          raw_item_id: row.id,
          episode_guid: row.external_id,
          audio_url: row.metadata?.audio_url,
          error: String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'error'
      );
    }
  }
}

async function downloadPodcastAudio(audioUrl: string, episodeId: string): Promise<string> {
  const tempDir = tmpdir();
  const audioFile = join(tempDir, `${episodeId}.mp3`);

  return new Promise((resolve, reject) => {
    const curl = spawn('curl', [
      '-L', // Follow redirects
      '-o',
      audioFile,
      '--max-filesize',
      '1073741824', // 1GB limit
      '--connect-timeout',
      '30',
      '--max-time',
      '1800', // 30 minutes max download time
      audioUrl,
    ]);

    let errorOutput = '';
    curl.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    curl.on('close', (code) => {
      if (code === 0) {
        resolve(audioFile);
      } else {
        reject(new Error(`Audio download failed with code ${code}: ${errorOutput}`));
      }
    });

    // 30 minute timeout for large podcast files
    setTimeout(() => {
      curl.kill();
      reject(new Error('Audio download timeout (30 minutes)'));
    }, 1800_000);
  });
}

async function transcribePodcastAudio(
  audioPath: string,
  episodeId: string
): Promise<{
  transcript: string;
  vttContent: string;
  language: string;
}> {
  const tempDir = tmpdir();
  const outputPrefix = join(tempDir, episodeId);

  return new Promise((resolve, reject) => {
    // Use larger model for podcasts (better accuracy for speech)
    const whisper = spawn('whisper', [
      audioPath,
      '--model',
      process.env.WHISPER_MODEL || 'small', // Default to 'small' for podcasts
      '--output_format',
      'vtt',
      '--output_dir',
      tempDir,
      '--output_file',
      episodeId,
      '--language',
      'auto',
      '--task',
      'transcribe',
      '--fp16',
      'False',
      '--condition_on_previous_text',
      'True', // Better for long-form content
      '--temperature',
      '0.0', // More deterministic for podcasts
      '--compression_ratio_threshold',
      '2.4', // Handle speech patterns better
      '--logprob_threshold',
      '-1.0',
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

    // 45 minute timeout for long podcast transcription
    setTimeout(() => {
      whisper.kill();
      reject(new Error('Transcription timeout (45 minutes)'));
    }, 2700_000);
  });
}

async function uploadPodcastAudio(episodeId: string, audioPath: string): Promise<string> {
  const fileName = `${episodeId}.mp3`;
  const fileBuffer = await fs.readFile(audioPath);

  const { data, error } = await supabaseAdmin.storage.from('podcast-audio').upload(fileName, fileBuffer, {
    contentType: 'audio/mpeg',
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload podcast audio: ${error.message}`);
  }

  return `podcast-audio/${fileName}`;
}

async function uploadPodcastTranscript(episodeId: string, vttContent: string): Promise<string> {
  const fileName = `${episodeId}.vtt`;

  const { data, error } = await supabaseAdmin.storage.from('podcast-transcripts').upload(fileName, vttContent, {
    contentType: 'text/vtt',
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload podcast transcript: ${error.message}`);
  }

  return `podcast-transcripts/${fileName}`;
}
```

## Database Schema Extensions

### Storage Buckets for Podcasts

```sql
-- Create Supabase Storage buckets for podcast content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('podcast-audio', 'podcast-audio', false, 1073741824, ARRAY['audio/mpeg', 'audio/mp3']), -- 1GB limit
('podcast-transcripts', 'podcast-transcripts', false, 10485760, ARRAY['text/vtt', 'text/plain']); -- 10MB limit

-- Set up RLS policies for buckets
CREATE POLICY "Service role can manage podcast-audio" ON storage.objects
FOR ALL USING (bucket_id = 'podcast-audio' AND auth.role() = 'service_role');

CREATE POLICY "Service role can manage podcast-transcripts" ON storage.objects
FOR ALL USING (bucket_id = 'podcast-transcripts' AND auth.role() = 'service_role');

-- Allow authenticated users to read transcripts and audio
CREATE POLICY "Authenticated users can read podcast content" ON storage.objects
FOR SELECT USING (bucket_id IN ('podcast-transcripts', 'podcast-audio') AND auth.role() = 'authenticated');
```

### Database Schema Updates

```sql
-- Add podcast-specific fields and cross-platform linking
ALTER TABLE public.contents
ADD COLUMN IF NOT EXISTS podcast_guid text,
ADD COLUMN IF NOT EXISTS episode_number integer,
ADD COLUMN IF NOT EXISTS season_number integer,
ADD COLUMN IF NOT EXISTS show_name text;

-- Add cross-platform content relationships
CREATE TABLE IF NOT EXISTS public.content_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  related_story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('podcast_video_pair', 'duplicate', 'related')),
  confidence_score decimal(3,2) NOT NULL DEFAULT 0.0,
  match_reasons jsonb,
  created_at timestamptz DEFAULT NOW(),

  UNIQUE(primary_story_id, related_story_id, relationship_type)
);

-- Add indexes for podcast content queries
CREATE INDEX IF NOT EXISTS idx_contents_podcast_guid ON public.contents(podcast_guid) WHERE podcast_guid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contents_show_name ON public.contents(show_name) WHERE show_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_raw_items_podcast ON public.raw_items(kind, external_id) WHERE kind = 'podcast';
CREATE INDEX IF NOT EXISTS idx_content_relationships_primary ON public.content_relationships(primary_story_id);
CREATE INDEX IF NOT EXISTS idx_content_relationships_related ON public.content_relationships(related_story_id);

-- Add podcast source validation
ALTER TABLE public.sources
ADD CONSTRAINT check_podcast_metadata
CHECK (
  (kind NOT IN ('podcast_show', 'podcast_rss')) OR
  (metadata IS NOT NULL AND metadata != '{}')
);

-- Function to get podcast sources
CREATE OR REPLACE FUNCTION get_podcast_sources()
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
  WHERE kind IN ('podcast_show', 'podcast_rss')
  AND (metadata IS NOT NULL);
$$;

-- Function to find potential content matches
CREATE OR REPLACE FUNCTION find_potential_content_matches(
  episode_title text,
  episode_duration integer DEFAULT NULL,
  published_date timestamptz DEFAULT NULL,
  host_name text DEFAULT NULL
)
RETURNS TABLE(
  story_id uuid,
  story_title text,
  story_kind text,
  similarity_score decimal,
  duration_diff integer
)
LANGUAGE sql
AS $$
  SELECT
    s.id,
    s.title,
    s.kind,
    similarity(LOWER(s.title), LOWER(episode_title)) as similarity_score,
    ABS(COALESCE((s.metadata->>'duration_seconds')::integer, 0) - COALESCE(episode_duration, 0)) as duration_diff
  FROM public.stories s
  WHERE
    s.kind IN ('youtube', 'article')
    AND similarity(LOWER(s.title), LOWER(episode_title)) > 0.3
    AND (published_date IS NULL OR ABS(EXTRACT(EPOCH FROM (s.published_at - published_date))) < 604800) -- Within 1 week
  ORDER BY similarity_score DESC, duration_diff ASC
  LIMIT 10;
$$;
```

## AI Analysis Integration

### Enhanced Podcast Analysis

```typescript
// worker/src/analyze/llm.ts - Podcast-specific analysis
const PODCAST_ANALYSIS_PROMPT = `
You are analyzing a podcast episode transcript. Consider the conversational format, host expertise, and guest insights.

Episode Title: {title}
Show: {show_name}
Host: {host_name}
Duration: {duration_minutes} minutes
Episode: {episode_info}
Published: {published_date}

Transcript:
{transcript}

Provide your analysis in this exact JSON format:
{
  "why_it_matters": "3-5 bullet points explaining why this podcast episode is significant, considering host/guest expertise, unique insights shared, and practical value",
  "chili": 0-5, // Importance score: 0=not important, 5=extremely important/actionable
  "confidence": 0.0-1.0, // Confidence based on content depth, host authority, and transcript quality
  "citations": [
    {
      "title": "Study, book, or resource mentioned",
      "url": "URL if mentioned, otherwise episode URL",
      "domain": "domain.com",
      "timestamp": "MM:SS if specific moment referenced",
      "context": "Brief context of why this was cited"
    }
  ]
}

Consider:
- Host and guest expertise/credentials
- Unique insights not available elsewhere
- Actionable advice and practical applications
- Scientific accuracy and evidence quality
- Conversational depth and nuance
- Potential impact on listener behavior/knowledge
`;

async function analyzePodcastContent(story: StoryRow, content: ContentRow): Promise<AnalysisResult> {
  const metadata = story.metadata as any;
  const durationMinutes = Math.round((metadata.duration_seconds || 0) / 60);
  const publishedDate = story.published_at ? new Date(story.published_at).toLocaleDateString() : 'Unknown';

  const episodeInfo =
    [
      metadata.season_number ? `Season ${metadata.season_number}` : null,
      metadata.episode_number ? `Episode ${metadata.episode_number}` : null,
    ]
      .filter(Boolean)
      .join(', ') || 'Episode';

  const prompt = PODCAST_ANALYSIS_PROMPT.replace('{title}', story.title || 'Untitled Episode')
    .replace('{show_name}', metadata.show_name || 'Unknown Show')
    .replace('{host_name}', metadata.host_name || 'Unknown Host')
    .replace('{duration_minutes}', durationMinutes.toString())
    .replace('{episode_info}', episodeInfo)
    .replace('{published_date}', publishedDate)
    .replace('{transcript}', content.text.slice(0, 12000)); // Larger context for podcasts

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2, // Lower temperature for more consistent analysis
    max_tokens: 1200, // More tokens for detailed podcast analysis
  });

  const analysisText = response.choices[0]?.message?.content;
  if (!analysisText) {
    throw new Error('No analysis content returned from OpenAI');
  }

  return parseAnalysisResponse(analysisText);
}

// Update main analysis function to handle podcasts
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

  // Use content-specific analysis
  if (story.kind === 'podcast') {
    analysis = await analyzePodcastContent(story, content);
  } else if (story.kind === 'youtube') {
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

  // Generate embeddings
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

## Worker Integration & Deployment

### Updated Worker Main Module

```typescript
// worker/src/worker.ts - Podcast integration
import { runIngestPodcasts } from './ingest/podcasts.js';
import { runPodcastExtract } from './extract/podcasts.js';

// Add podcast scheduling (every 15 minutes, offset from other sources)
await boss.schedule('ingest:pull', '7,22,37,52 * * * *', { source: 'podcast' }, { tz: CRON_TZ });

// Update ingest:pull worker to handle podcasts
await boss.work('ingest:pull', { teamSize: 1, teamConcurrency: 1 }, async (jobs) => {
  for (const job of jobs) {
    const { source } = (job.data || {}) as { source?: string };
    log('ingest_pull_start', { jobId: job.id, source });

    try {
      if (source === 'rss') {
        await runIngestRss(boss);
      } else if (source === 'youtube') {
        await runIngestYouTube(boss);
      } else if (source === 'podcast') {
        await runIngestPodcasts(boss);
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

// Update ingest:fetch-content worker to handle podcasts
await boss.work('ingest:fetch-content', { teamSize: 2, teamConcurrency: 1 }, async (jobs) => {
  for (const job of jobs) {
    const jobData = job.data as { rawItemIds: string[] };
    log('fetch_content_start', { jobId: job.id, rawItemCount: jobData.rawItemIds?.length });

    try {
      const rawItems = await findRawItemsByIds(jobData.rawItemIds || []);
      const podcastItems = rawItems.filter((item) => item.kind === 'podcast');
      const youtubeItems = rawItems.filter((item) => item.kind === 'youtube');
      const articleItems = rawItems.filter((item) => !['podcast', 'youtube'].includes(item.kind));

      // Process podcasts with high-quality audio transcription
      if (podcastItems.length > 0) {
        await runPodcastExtract({ rawItemIds: podcastItems.map((item) => item.id) }, boss);
      }

      // Process YouTube videos
      if (youtubeItems.length > 0) {
        await runYouTubeExtract({ rawItemIds: youtubeItems.map((item) => item.id) }, boss);
      }

      // Process articles
      if (articleItems.length > 0) {
        await runExtract({ rawItemIds: articleItems.map((item) => item.id) }, boss);
      }

      await boss.complete('ingest:fetch-content', job.id);
      log('fetch_content_done', {
        jobId: job.id,
        podcast_items: podcastItems.length,
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

### Environment Configuration

```bash
# worker/.env additions for podcast pipeline
APPLE_PODCASTS_API_KEY=your_apple_podcasts_api_key
APPLE_PODCASTS_RATE_LIMIT=1000
RSS_FETCH_TIMEOUT=30000
WHISPER_MODEL=small  # Better accuracy for podcast speech
MAX_PODCAST_DURATION=14400  # 4 hours in seconds
MAX_PODCAST_FILE_SIZE=1073741824  # 1GB in bytes
CONTENT_MATCHING_THRESHOLD=0.8  # Confidence threshold for content matching
```

### Docker Configuration Updates

```dockerfile
# worker/Dockerfile additions for podcast processing
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp, Whisper, and RSS parsing dependencies
RUN pip3 install --no-cache-dir \
    yt-dlp==2024.1.7 \
    openai-whisper==20231117 \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install Node.js dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Add RSS parser and content matching dependencies
RUN npm install rss-parser string-similarity

COPY . .
RUN npm run build

# Create temp directories with proper permissions
RUN mkdir -p /tmp/podcast-processing && chmod 777 /tmp/podcast-processing
RUN mkdir -p /tmp/content-matching && chmod 777 /tmp/content-matching

EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring & Analytics

### Podcast-Specific Metrics

```typescript
// Enhanced logging for podcast pipeline monitoring
interface PodcastMetrics {
  // Ingestion metrics
  episodes_discovered: number;
  episodes_processed: number;
  episodes_matched: number;
  duplicates_avoided: number;

  // Content quality metrics
  avg_transcript_accuracy: number;
  avg_episode_duration_minutes: number;
  avg_processing_time_ms: number;

  // Cross-platform metrics
  podcast_video_pairs_created: number;
  content_deduplication_rate: number;
  match_confidence_avg: number;

  // Error metrics
  rss_fetch_failures: number;
  transcription_failures: number;
  matching_algorithm_errors: number;
}

// Dashboard queries for podcast monitoring
const PODCAST_DASHBOARD_QUERIES = {
  // Daily podcast ingestion summary
  daily_podcast_summary: `
    SELECT
      DATE(discovered_at) as date,
      COUNT(*) FILTER (WHERE kind = 'podcast') as podcast_episodes,
      COUNT(DISTINCT (metadata->>'show_name')) FILTER (WHERE kind = 'podcast') as unique_shows,
      AVG(LENGTH(contents.text)) FILTER (WHERE raw_items.kind = 'podcast') as avg_transcript_length,
      AVG((raw_items.metadata->>'duration_seconds')::int) FILTER (WHERE kind = 'podcast') as avg_duration_seconds
    FROM raw_items
    LEFT JOIN contents ON contents.raw_item_id = raw_items.id
    WHERE discovered_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(discovered_at)
    ORDER BY date DESC;
  `,

  // Cross-platform content relationships
  content_relationships_summary: `
    SELECT
      cr.relationship_type,
      COUNT(*) as relationship_count,
      AVG(cr.confidence_score) as avg_confidence,
      COUNT(DISTINCT cr.primary_story_id) as unique_primary_stories,
      COUNT(DISTINCT cr.related_story_id) as unique_related_stories
    FROM content_relationships cr
    WHERE cr.created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY cr.relationship_type;
  `,

  // Podcast processing performance
  podcast_processing_performance: `
    SELECT
      c.show_name,
      COUNT(*) as episodes_count,
      AVG(so.chili) as avg_chili,
      AVG(so.confidence) as avg_confidence,
      AVG(LENGTH(c.text)) as avg_transcript_length,
      COUNT(cr.id) as cross_platform_matches
    FROM contents c
    JOIN stories s ON s.content_id = c.id
    LEFT JOIN story_overlays so ON so.story_id = s.id
    LEFT JOIN content_relationships cr ON cr.primary_story_id = s.id
    WHERE s.kind = 'podcast'
      AND s.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY c.show_name
    ORDER BY episodes_count DESC;
  `,
};
```

## Implementation Timeline & Expected Outcomes

### Phase 1: Foundation & Content Matching (Week 1)

- ✅ **Day 1-2**: Apple Podcasts API integration and RSS parsing setup
- ✅ **Day 3-4**: Content matching algorithms and deduplication logic
- ✅ **Day 5-7**: Database schema updates and cross-platform relationship tables

### Phase 2: Audio Processing & Integration (Week 2)

- ✅ **Day 8-10**: High-quality podcast audio download and transcription
- ✅ **Day 11-13**: Enhanced Whisper settings for podcast speech recognition
- ✅ **Day 14**: Supabase Storage integration and content linking

### Phase 3: Smart Content Management (Week 3)

- ✅ **Day 15-17**: Cross-platform content relationship management
- ✅ **Day 18-19**: Enhanced AI analysis for podcast-specific insights
- ✅ **Day 20-21**: Monitoring, analytics, and performance optimization

### Expected Impact Metrics

**Content Quality Improvement:**

- **Higher transcription accuracy**: Podcast audio typically 20-30% clearer than YouTube
- **Reduced processing redundancy**: 40-60% of podcast episodes match existing YouTube content
- **Enhanced AI analysis**: Podcast format provides richer conversational context

**Content Volume Optimization:**

- **Smart deduplication**: Avoid processing duplicate content across platforms
- **Quality prioritization**: Use podcast audio for transcription, YouTube video for display
- **Comprehensive coverage**: Capture podcast-exclusive content not available on YouTube

**User Experience Enhancement:**

- **Best of both worlds**: High-quality transcripts with video player experience
- **Unified content discovery**: Related podcast episodes and YouTube videos linked together
- **Rich metadata**: Episode numbers, show information, host details for better organization

**Resource Efficiency:**

- **Reduced compute costs**: Skip transcription for content already processed from podcasts
- **Storage optimization**: Single high-quality transcript serves multiple content formats
- **API efficiency**: Intelligent content matching reduces redundant processing

This comprehensive podcast ingestion specification provides a complete roadmap for implementing intelligent cross-platform content management within the existing ZEKE pipeline architecture, ensuring optimal content quality while minimizing redundant processing.
