import type PgBoss from "pg-boss";
import {
  findRawItemsByIds,
  findStoryIdByContentHash,
  insertContents,
  insertStory,
} from "../db.js";
import { extractAudio } from "../extract/extract-youtube-audio.js";
import { log } from "../log.js";
import { generateVTTContent } from "../storage/generate-vtt-content.js";
import { prepareYouTubeTranscript } from "../storage/prepare-youtube-transcript.js";
import { transcribeAudio } from "../transcribe/whisper.js";
import { hashText } from "../util.js";
import { cleanupVideoTempFiles } from "../utils/temp-files.js";

// Constants
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const DESCRIPTION_MAX_LENGTH = 500;
const MAX_PREVIEW_SEGMENTS = 10;
const TIME_PAD_LENGTH = 2;
const UPLOAD_DATE_LENGTH = 8;
const UPLOAD_DATE_YEAR_END = 4;
const UPLOAD_DATE_MONTH_START = 4;
const UPLOAD_DATE_MONTH_END = 6;
const UPLOAD_DATE_DAY_START = 6;
const UPLOAD_DATE_DAY_END = 8;
const ROUNDING_FACTOR = 100;

const UPLOAD_DATE_REGEX = /(\d{4})(\d{2})(\d{2})/;

export type YouTubeExtractionJobData = {
  rawItemIds: string[];
  videoId: string;
  sourceKind: string;
};

type VideoMetadata = {
  title?: string;
  uploader?: string;
  duration?: number;
  uploadDate?: string;
  viewCount?: string;
  description?: string;
  filesize?: number;
};

type TranscriptionResult = {
  language: string;
  modelUsed: string;
  segments: Array<{ start: number; end: number; text: string }>;
  processingTimeMs: number;
  text: string;
  success?: boolean;
};

export async function extractYouTubeContent(
  jobData: YouTubeExtractionJobData,
  boss: PgBoss
) {
  const { rawItemIds, videoId, sourceKind } = jobData;
  const rows = await findRawItemsByIds(rawItemIds);

  for (const row of rows) {
    try {
      const t0 = Date.now();

      log("youtube_extract_start", {
        comp: "extract",
        raw_item_id: row.id,
        video_id: videoId,
        source_kind: sourceKind,
        url: row.url,
      });

      const videoUrl = row.url;
      const audioResult = await extractAudio(videoUrl, videoId);
      if (!audioResult.success)
        throw new Error(`Audio extraction failed: ${audioResult.error}`);

      log("youtube_audio_extracted", {
        comp: "extract",
        raw_item_id: row.id,
        video_id: videoId,
        audio_path: audioResult.audioPath,
        duration: audioResult.metadata.duration,
        file_size_mb:
          Math.round(
            ((audioResult.metadata.filesize || 0) / BYTES_PER_MB) *
              ROUNDING_FACTOR
          ) / ROUNDING_FACTOR,
      });

      const transcriptionResult = await transcribeAudio(
        audioResult.audioPath,
        videoId,
        {
          model: "base",
          language: undefined,
          wordTimestamps: true,
        }
      );
      if (!transcriptionResult.success) {
        throw new Error(
          `Transcription failed: ${String((transcriptionResult as any).error || "unknown")}`
        );
      }

      log("youtube_transcription_complete", {
        comp: "extract",
        raw_item_id: row.id,
        video_id: videoId,
        language: transcriptionResult.language,
        text_length: transcriptionResult.text.length,
        segments: transcriptionResult.segments.length,
        processing_time_ms: transcriptionResult.processingTimeMs,
      });

      const transcriptText = transcriptionResult.text.trim();
      if (!transcriptText)
        throw new Error("No text extracted from transcription");

      const vttContent = generateVTTContent(transcriptionResult);
      const transcriptData = await prepareYouTubeTranscript(
        videoId,
        vttContent,
        transcriptText
      );
      if (!transcriptData.success) {
        throw new Error(
          `Transcript preparation failed: ${transcriptData.error}`
        );
      }

      const enhancedText = formatYouTubeContent(
        transcriptText,
        audioResult.metadata,
        transcriptionResult
      );

      const content_hash = hashText(enhancedText);
      const content_id = await insertContents({
        raw_item_id: row.id,
        text: enhancedText,
        html_url: videoUrl,
        transcript_url: transcriptData.transcriptUrl,
        transcript_vtt: transcriptData.vttContent,
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
          kind: "youtube",
          published_at: audioResult.metadata.uploadDate
            ? new Date(
                audioResult.metadata.uploadDate.replace(
                  UPLOAD_DATE_REGEX,
                  "$1-$2-$3"
                )
              ).toISOString()
            : null,
        }));

      await boss.send("analyze:llm", { storyId });
      await cleanupVideoTempFiles(videoId);

      log("youtube_extract_success", {
        comp: "extract",
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
        "youtube_extract_error",
        {
          comp: "extract",
          raw_item_id: row.id,
          video_id: videoId,
          url: row.url,
          err: String(err),
        },
        "error"
      );
      try {
        await cleanupVideoTempFiles(videoId);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

function formatYouTubeContent(
  transcriptText: string,
  metadata: VideoMetadata,
  transcriptionResult: TranscriptionResult
): string {
  const sections: string[] = [];

  sections.push("=== VIDEO INFORMATION ===");
  sections.push(`Title: ${metadata.title}`);
  sections.push(`Channel: ${metadata.uploader}`);
  sections.push(`Duration: ${formatDuration(metadata.duration)}`);
  sections.push(`Upload Date: ${formatUploadDate(metadata.uploadDate)}`);
  if (metadata.viewCount) {
    sections.push(
      `Views: ${Number.parseInt(metadata.viewCount, 10).toLocaleString()}`
    );
  }
  if (metadata.description) {
    sections.push(
      `Description: ${metadata.description.substring(0, DESCRIPTION_MAX_LENGTH)}${metadata.description.length > DESCRIPTION_MAX_LENGTH ? "..." : ""}`
    );
  }

  sections.push("");
  sections.push("=== TRANSCRIPTION INFORMATION ===");
  sections.push(`Language: ${transcriptionResult.language}`);
  sections.push(`Model: ${transcriptionResult.modelUsed}`);
  sections.push(`Segments: ${transcriptionResult.segments.length}`);
  sections.push(
    `Processing Time: ${Math.round(transcriptionResult.processingTimeMs / MILLISECONDS_PER_SECOND)}s`
  );

  sections.push("");
  sections.push("=== TRANSCRIPT ===");
  sections.push(transcriptText);

  if (transcriptionResult.segments && transcriptionResult.segments.length > 0) {
    sections.push("");
    sections.push("=== TIMESTAMPED SEGMENTS ===");
    const maxSegments = Math.min(
      MAX_PREVIEW_SEGMENTS,
      transcriptionResult.segments.length
    );
    for (let i = 0; i < maxSegments; i++) {
      const segment = transcriptionResult.segments[i];
      const startTime = formatTimestamp(segment.start);
      const endTime = formatTimestamp(segment.end);
      sections.push(`[${startTime} - ${endTime}] ${segment.text.trim()}`);
    }
    if (transcriptionResult.segments.length > maxSegments) {
      sections.push(
        `... and ${transcriptionResult.segments.length - maxSegments} more segments`
      );
    }
  }

  return sections.join("\n");
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00";
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const secs = Math.floor(seconds % SECONDS_PER_MINUTE);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(TIME_PAD_LENGTH, "0")}:${secs.toString().padStart(TIME_PAD_LENGTH, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(TIME_PAD_LENGTH, "0")}`;
}

function formatUploadDate(uploadDate?: string): string {
  if (!uploadDate || uploadDate.length !== UPLOAD_DATE_LENGTH) return "Unknown";
  const year = uploadDate.substring(0, UPLOAD_DATE_YEAR_END);
  const month = uploadDate.substring(
    UPLOAD_DATE_MONTH_START,
    UPLOAD_DATE_MONTH_END
  );
  const day = uploadDate.substring(UPLOAD_DATE_DAY_START, UPLOAD_DATE_DAY_END);
  return `${year}-${month}-${day}`;
}

function formatTimestamp(seconds?: number): string {
  const minutes = Math.floor((seconds || 0) / SECONDS_PER_MINUTE);
  const secs = Math.floor((seconds || 0) % SECONDS_PER_MINUTE);
  return `${minutes}:${secs.toString().padStart(TIME_PAD_LENGTH, "0")}`;
}
