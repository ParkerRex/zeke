import { spawn } from 'node:child_process';
import { log } from '../log.js';

export type VideoMetadata = {
  videoId: string;
  title: string;
  duration: number;
  viewCount?: number;
  likeCount?: number;
  uploadDate: string;
  uploader: string;
  description: string;
  thumbnailUrl?: string;
  format: string;
  filesize?: number;
};

const SECONDS_TO_MS = 1000;
const METADATA_EXTRACTION_TIMEOUT_SECONDS = 30;
const METADATA_EXTRACTION_TIMEOUT_MS =
  METADATA_EXTRACTION_TIMEOUT_SECONDS * SECONDS_TO_MS;

export async function getVideoMetadata(
  videoId: string
): Promise<VideoMetadata> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    log('youtube_metadata_extraction_start', { videoId });

    const ytDlpArgs = [
      videoUrl,
      '--dump-json',
      '--no-playlist',
      '--socket-timeout',
      '30',
    ];

    const metadataPromise = new Promise<string>((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', ytDlpArgs);
      let stdout = '';
      let stderr = '';
      ytDlp.stdout.on('data', (d) => {
        stdout += d.toString();
      });
      ytDlp.stderr.on('data', (d) => {
        stderr += d.toString();
      });
      ytDlp.on('close', (code) =>
        code === 0
          ? resolve(stdout)
          : reject(
              new Error(`yt-dlp metadata failed with code ${code}: ${stderr}`)
            )
      );
      ytDlp.on('error', (error) =>
        reject(
          new Error(`Failed to spawn yt-dlp for metadata: ${error.message}`)
        )
      );
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Metadata extraction timeout')),
        METADATA_EXTRACTION_TIMEOUT_MS
      );
    });

    const jsonOutput = await Promise.race([metadataPromise, timeoutPromise]);
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
      { videoId, error: String(error) },
      'error'
    );
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
