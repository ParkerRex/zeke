import PgBoss from 'pg-boss';
import { findRawItemsByIds, insertContents, findStoryIdByContentHash, insertStory } from '../db.js';
import { hashText } from '../util.js';
import { log } from '../log.js';
import { extractAudio, getVideoMetadata } from './youtube-audio.js';
import { transcribeAudio } from '../transcribe/whisper.js';
import { transcriptionQueue } from '../transcribe/queue.js';
import { cleanupVideoTempFiles } from '../utils/temp-files.js';

export interface YouTubeExtractionJobData {
  rawItemIds: string[];
  videoId: string;
  sourceKind: string;
}

/**
 * Extract YouTube content: audio → transcription → text content
 */
export async function runYouTubeFetchAndExtract(jobData: YouTubeExtractionJobData, boss: PgBoss) {
  const { rawItemIds, videoId, sourceKind } = jobData;
  const rows = await findRawItemsByIds(rawItemIds || []);

  for (const row of rows) {
    try {
      const t0 = Date.now();

      log('youtube_extract_start', {
        comp: 'extract',
        raw_item_id: row.id,
        video_id: videoId,
        source_kind: sourceKind,
        url: row.url,
      });

      // Step 1: Extract video metadata and audio
      const videoUrl = row.url;
      const audioResult = await extractAudio(videoUrl, videoId);

      if (!audioResult.success) {
        throw new Error(`Audio extraction failed: ${audioResult.error}`);
      }

      log('youtube_audio_extracted', {
        comp: 'extract',
        raw_item_id: row.id,
        video_id: videoId,
        audio_path: audioResult.audioPath,
        duration: audioResult.metadata.duration,
        file_size_mb: Math.round(((audioResult.metadata.filesize || 0) / (1024 * 1024)) * 100) / 100,
      });

      // Step 2: Transcribe audio using Whisper
      const transcriptionResult = await transcribeAudio(audioResult.audioPath, videoId, {
        model: 'base', // Good balance of speed and accuracy
        language: undefined, // Auto-detect
        wordTimestamps: true,
      });

      if (!transcriptionResult.success) {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      }

      log('youtube_transcription_complete', {
        comp: 'extract',
        raw_item_id: row.id,
        video_id: videoId,
        language: transcriptionResult.language,
        text_length: transcriptionResult.text.length,
        segments: transcriptionResult.segments.length,
        processing_time_ms: transcriptionResult.processingTimeMs,
      });

      // Step 3: Create content from transcription
      const transcriptText = transcriptionResult.text.trim();
      if (!transcriptText) {
        throw new Error('No text extracted from transcription');
      }

      // Enhance the text with video metadata for better context
      const enhancedText = formatYouTubeContent(transcriptText, audioResult.metadata, transcriptionResult);

      const content_hash = hashText(enhancedText);
      const content_id = await insertContents({
        raw_item_id: row.id,
        text: enhancedText,
        html_url: videoUrl,
        lang: transcriptionResult.language,
        content_hash,
      });

      // Step 4: Create or link story
      const existingStoryId = await findStoryIdByContentHash(content_hash);
      const storyId =
        existingStoryId ??
        (await insertStory({
          content_id,
          title: audioResult.metadata.title || row.title || null,
          canonical_url: videoUrl,
          primary_url: videoUrl,
          kind: 'youtube',
          published_at: audioResult.metadata.uploadDate
            ? new Date(audioResult.metadata.uploadDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString()
            : null,
        }));

      // Step 5: Enqueue AI analysis
      await boss.send('analyze:llm', { storyId });

      // Step 6: Cleanup temporary files
      await cleanupVideoTempFiles(videoId);

      log('youtube_extract_success', {
        comp: 'extract',
        raw_item_id: row.id,
        content_id,
        story_id: storyId,
        video_id: videoId,
        content_hash,
        url: videoUrl,
        text_len: enhancedText.length,
        duration: audioResult.metadata.duration,
        language: transcriptionResult.language,
        duration_ms: Date.now() - t0,
      });
    } catch (err) {
      log(
        'youtube_extract_error',
        {
          comp: 'extract',
          raw_item_id: row.id,
          video_id: videoId,
          url: row.url,
          err: String(err),
        },
        'error'
      );

      // Cleanup on error
      try {
        await cleanupVideoTempFiles(videoId);
      } catch (cleanupErr) {
        log(
          'youtube_cleanup_error',
          {
            video_id: videoId,
            cleanup_error: String(cleanupErr),
          },
          'warn'
        );
      }
    }
  }
}

/**
 * Format YouTube content with metadata for better AI analysis
 */
function formatYouTubeContent(transcriptText: string, metadata: any, transcriptionResult: any): string {
  const sections = [];

  // Video metadata section
  sections.push('=== VIDEO INFORMATION ===');
  sections.push(`Title: ${metadata.title}`);
  sections.push(`Channel: ${metadata.uploader}`);
  sections.push(`Duration: ${formatDuration(metadata.duration)}`);
  sections.push(`Upload Date: ${formatUploadDate(metadata.uploadDate)}`);

  if (metadata.viewCount) {
    sections.push(`Views: ${parseInt(metadata.viewCount).toLocaleString()}`);
  }

  if (metadata.description) {
    sections.push(
      `Description: ${metadata.description.substring(0, 500)}${metadata.description.length > 500 ? '...' : ''}`
    );
  }

  // Transcription metadata
  sections.push('');
  sections.push('=== TRANSCRIPTION INFORMATION ===');
  sections.push(`Language: ${transcriptionResult.language}`);
  sections.push(`Model: ${transcriptionResult.modelUsed}`);
  sections.push(`Segments: ${transcriptionResult.segments.length}`);
  sections.push(`Processing Time: ${Math.round(transcriptionResult.processingTimeMs / 1000)}s`);

  // Main transcript
  sections.push('');
  sections.push('=== TRANSCRIPT ===');
  sections.push(transcriptText);

  // Timestamped segments (for reference)
  if (transcriptionResult.segments && transcriptionResult.segments.length > 0) {
    sections.push('');
    sections.push('=== TIMESTAMPED SEGMENTS ===');

    // Include first few segments for context
    const maxSegments = Math.min(10, transcriptionResult.segments.length);
    for (let i = 0; i < maxSegments; i++) {
      const segment = transcriptionResult.segments[i];
      const startTime = formatTimestamp(segment.start);
      const endTime = formatTimestamp(segment.end);
      sections.push(`[${startTime} - ${endTime}] ${segment.text.trim()}`);
    }

    if (transcriptionResult.segments.length > maxSegments) {
      sections.push(`... and ${transcriptionResult.segments.length - maxSegments} more segments`);
    }
  }

  return sections.join('\n');
}

/**
 * Format duration in seconds to HH:MM:SS
 */
function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Format upload date from YYYYMMDD to readable format
 */
function formatUploadDate(uploadDate: string): string {
  if (!uploadDate || uploadDate.length !== 8) return 'Unknown';

  const year = uploadDate.substring(0, 4);
  const month = uploadDate.substring(4, 6);
  const day = uploadDate.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Format timestamp in seconds to MM:SS
 */
function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Queue-based YouTube extraction for better resource management
 */
export async function runYouTubeQueuedExtract(jobData: YouTubeExtractionJobData, boss: PgBoss) {
  const { rawItemIds, videoId, sourceKind } = jobData;
  const rows = await findRawItemsByIds(rawItemIds || []);

  for (const row of rows) {
    try {
      log('youtube_queued_extract_start', {
        comp: 'extract',
        raw_item_id: row.id,
        video_id: videoId,
        source_kind: sourceKind,
      });

      // Step 1: Extract audio
      const videoUrl = row.url;
      const audioResult = await extractAudio(videoUrl, videoId);

      if (!audioResult.success) {
        throw new Error(`Audio extraction failed: ${audioResult.error}`);
      }

      // Step 2: Queue transcription job
      const transcriptionJobId = transcriptionQueue.addJob(
        videoId,
        audioResult.audioPath,
        {
          model: 'base',
          language: undefined,
          wordTimestamps: true,
        },
        sourceKind === 'youtube_channel' ? 'high' : 'medium', // Prioritize channel content
        2 // max retries
      );

      // Step 3: Wait for transcription to complete
      const transcriptionJob = await transcriptionQueue.waitForJob(
        transcriptionJobId,
        30 * 60 * 1000 // 30 minute timeout
      );

      if (!transcriptionJob || !transcriptionJob.result?.success) {
        throw new Error(`Transcription job failed: ${transcriptionJob?.error || 'timeout'}`);
      }

      // Continue with content creation...
      const transcriptionResult = transcriptionJob.result;
      const transcriptText = transcriptionResult.text.trim();

      if (!transcriptText) {
        throw new Error('No text extracted from transcription');
      }

      const enhancedText = formatYouTubeContent(transcriptText, audioResult.metadata, transcriptionResult);

      const content_hash = hashText(enhancedText);
      const content_id = await insertContents({
        raw_item_id: row.id,
        text: enhancedText,
        html_url: videoUrl,
        lang: transcriptionResult.language,
        content_hash,
      });

      const existingStoryId = await findStoryIdByContentHash(content_hash);
      const storyId =
        existingStoryId ??
        (await insertStory({
          content_id,
          title: audioResult.metadata.title || row.title || null,
          canonical_url: videoUrl,
          primary_url: videoUrl,
          kind: 'youtube',
          published_at: audioResult.metadata.uploadDate
            ? new Date(audioResult.metadata.uploadDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString()
            : null,
        }));

      await boss.send('analyze:llm', { storyId });

      log('youtube_queued_extract_success', {
        comp: 'extract',
        raw_item_id: row.id,
        content_id,
        story_id: storyId,
        video_id: videoId,
        transcription_job_id: transcriptionJobId,
      });
    } catch (err) {
      log(
        'youtube_queued_extract_error',
        {
          comp: 'extract',
          raw_item_id: row.id,
          video_id: videoId,
          err: String(err),
        },
        'error'
      );

      await cleanupVideoTempFiles(videoId);
    }
  }
}
