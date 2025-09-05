import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { log } from '../log.js';

export interface VideoMetadata {
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
}

export interface AudioExtractionResult {
  audioPath: string;
  metadata: VideoMetadata;
  success: boolean;
  error?: string;
}

/**
 * Extract audio from YouTube video using yt-dlp
 */
export async function extractAudio(videoUrl: string, videoId: string): Promise<AudioExtractionResult> {
  const tempDir = '/tmp/youtube-processing';
  const audioPath = join(tempDir, `${videoId}.m4a`);

  try {
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    log('youtube_audio_extraction_start', {
      videoId,
      videoUrl,
      audioPath,
    });

    // Extract audio using yt-dlp
    const ytDlpArgs = [
      videoUrl,
      '--extract-audio',
      '--audio-format',
      'm4a',
      '--audio-quality',
      '0', // Best quality
      '--output',
      audioPath.replace('.m4a', '.%(ext)s'),
      '--no-playlist',
      '--max-filesize',
      '500M', // 500MB limit
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

      ytDlp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`));
        }
      });

      ytDlp.on('error', (error) => {
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
      });
    });

    // Set timeout for audio extraction (10 minutes)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Audio extraction timeout')), 10 * 60 * 1000);
    });

    await Promise.race([audioExtractionPromise, timeoutPromise]);

    // Verify audio file exists
    try {
      await fs.access(audioPath);
    } catch {
      throw new Error(`Audio file not found at ${audioPath}`);
    }

    // Get file stats
    const stats = await fs.stat(audioPath);

    log('youtube_audio_extraction_complete', {
      videoId,
      audioPath,
      fileSizeBytes: stats.size,
      fileSizeMB: Math.round((stats.size / (1024 * 1024)) * 100) / 100,
    });

    // Get video metadata
    const metadata = await getVideoMetadata(videoId);

    return {
      audioPath,
      metadata,
      success: true,
    };
  } catch (error) {
    log(
      'youtube_audio_extraction_error',
      {
        videoId,
        videoUrl,
        error: String(error),
      },
      'error'
    );

    // Clean up partial files
    try {
      await fs.unlink(audioPath);
    } catch {
      // Ignore cleanup errors
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

/**
 * Get video metadata using yt-dlp --dump-json
 */
export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    log('youtube_metadata_extraction_start', { videoId });

    const ytDlpArgs = [videoUrl, '--dump-json', '--no-playlist', '--socket-timeout', '30'];

    const metadataPromise = new Promise<string>((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', ytDlpArgs);
      let stdout = '';
      let stderr = '';

      ytDlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytDlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytDlp.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`yt-dlp metadata failed with code ${code}: ${stderr}`));
        }
      });

      ytDlp.on('error', (error) => {
        reject(new Error(`Failed to spawn yt-dlp for metadata: ${error.message}`));
      });
    });

    // Set timeout for metadata extraction (30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Metadata extraction timeout')), 30 * 1000);
    });

    const jsonOutput = await Promise.race([metadataPromise, timeoutPromise]);

    // Parse JSON output
    const metadata = JSON.parse(jsonOutput.trim());

    const result: VideoMetadata = {
      videoId,
      title: metadata.title || '',
      duration: metadata.duration || 0,
      viewCount: metadata.view_count,
      likeCount: metadata.like_count,
      uploadDate: metadata.upload_date || '',
      uploader: metadata.uploader || metadata.channel || '',
      description: metadata.description || '',
      thumbnailUrl: metadata.thumbnail,
      format: metadata.ext || 'm4a',
      filesize: metadata.filesize,
    };

    log('youtube_metadata_extraction_complete', {
      videoId,
      title: result.title,
      duration: result.duration,
      viewCount: result.viewCount,
      uploader: result.uploader,
    });

    return result;
  } catch (error) {
    log(
      'youtube_metadata_extraction_error',
      {
        videoId,
        error: String(error),
      },
      'error'
    );

    // Return minimal metadata on error
    return {
      videoId,
      title: `Video ${videoId}`,
      duration: 0,
      uploadDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
      uploader: 'Unknown',
      description: '',
      format: 'm4a',
    };
  }
}

/**
 * Check if yt-dlp is available and working
 */
export async function checkYtDlpAvailability(): Promise<boolean> {
  try {
    const checkPromise = new Promise<boolean>((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', ['--version']);

      ytDlp.on('close', (code) => {
        resolve(code === 0);
      });

      ytDlp.on('error', (error) => {
        reject(error);
      });
    });

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), 5000);
    });

    const isAvailable = await Promise.race([checkPromise, timeoutPromise]);

    log('youtube_ytdlp_availability_check', {
      available: isAvailable,
    });

    return isAvailable;
  } catch (error) {
    log(
      'youtube_ytdlp_availability_error',
      {
        error: String(error),
      },
      'error'
    );
    return false;
  }
}

/**
 * Get supported video formats for a URL
 */
export async function getSupportedFormats(videoUrl: string): Promise<string[]> {
  try {
    const ytDlpArgs = [videoUrl, '--list-formats', '--no-playlist'];

    const formatsPromise = new Promise<string>((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', ytDlpArgs);
      let stdout = '';

      ytDlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytDlp.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`yt-dlp list-formats failed with code ${code}`));
        }
      });
    });

    const output = await formatsPromise;

    // Parse format list (simplified)
    const formats = output
      .split('\n')
      .filter((line) => line.includes('audio only'))
      .map((line) => line.split(/\s+/)[0])
      .filter((format) => format && !format.includes('format'));

    return formats;
  } catch (error) {
    log(
      'youtube_formats_check_error',
      {
        videoUrl,
        error: String(error),
      },
      'error'
    );
    return [];
  }
}
