import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { log } from '../log.js';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_TO_MS = SECONDS_PER_MINUTE * MS_PER_SECOND;
const AUDIO_EXTRACTION_TIMEOUT_MINUTES = 10;
const AUDIO_EXTRACTION_TIMEOUT_MS =
  AUDIO_EXTRACTION_TIMEOUT_MINUTES * MINUTES_TO_MS;

const KILOBYTE = 1024;
const BYTES_TO_MB = KILOBYTE * KILOBYTE;
const DECIMAL_PLACES = 100;

export type VideoMetadata = {
  videoId: string;
  title: string;
  duration: number; // seconds
  viewCount?: number;
  likeCount?: number;
  uploadDate: string;
  uploader: string;
  description: string;
  thumbnailUrl?: string;
  format: string;
  filesize?: number;
};

export type AudioExtractionResult = {
  audioPath: string;
  metadata: VideoMetadata;
  success: boolean;
  error?: string;
};

export async function extractAudio(
  videoUrl: string,
  videoId: string
): Promise<AudioExtractionResult> {
  const tempDir = '/tmp/youtube-processing';
  const audioPath = join(tempDir, `${videoId}.m4a`);

  try {
    await fs.mkdir(tempDir, { recursive: true });

    log('youtube_audio_extraction_start', { videoId, videoUrl, audioPath });

    const ytDlpArgs = [
      videoUrl,
      '--extract-audio',
      '--audio-format',
      'm4a',
      '--audio-quality',
      '0',
      '--output',
      audioPath.replace('.m4a', '.%(ext)s'),
      '--no-playlist',
      '--max-filesize',
      '500M',
      '--socket-timeout',
      '30',
      '--retries',
      '3',
      '--fragment-retries',
      '3',
    ];

    const audioExtractionPromise = new Promise<void>((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', ytDlpArgs);
      let stderr = '';
      ytDlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      ytDlp.on('close', (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`))
      );
      ytDlp.on('error', (error) =>
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`))
      );
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Audio extraction timeout')),
        AUDIO_EXTRACTION_TIMEOUT_MS
      );
    });

    await Promise.race([audioExtractionPromise, timeoutPromise]);
    await fs.access(audioPath);

    const stats = await fs.stat(audioPath);
    const fileSizeBytes = stats.size;
    const fileSizeMb =
      Math.round((fileSizeBytes / BYTES_TO_MB) * DECIMAL_PLACES) /
      DECIMAL_PLACES;

    log('youtube_audio_extraction_complete', {
      videoId,
      audioPath,
      fileSizeMb,
    });

    return {
      audioPath,
      metadata: {
        videoId,
        title: '',
        duration: 0,
        uploadDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        uploader: '',
        description: '',
        thumbnailUrl: undefined,
        viewCount: undefined,
        likeCount: undefined,
        format: 'm4a',
        filesize: fileSizeBytes,
      },
      success: true,
    };
  } catch (error) {
    log(
      'youtube_audio_extraction_error',
      { videoId, videoUrl, error: String(error) },
      'error'
    );
    try {
      await fs.unlink(audioPath);
    } catch (deleteError) {
      log(
        'youtube_audio_deletion_error',
        { videoId, audioPath, error: String(deleteError) },
        'error'
      );
    }
    return {
      audioPath: '',
      metadata: {
        videoId,
        title: '',
        duration: 0,
        uploadDate: '',
        uploader: '',
        description: '',
        format: 'm4a',
      },
      success: false,
      error: String(error),
    };
  }
}
