import { google, type youtube_v3 } from 'googleapis';

export type YouTubeClient = {
  youtube: youtube_v3.Youtube;
  quotaLimit: number;
  quotaBuffer: number;
  quotaResetHour: number;
};

export function createYouTubeClient(config?: {
  apiKey?: string;
  quotaLimit?: number;
  quotaBuffer?: number;
  quotaResetHour?: number;
}): YouTubeClient {
  const apiKey = config?.apiKey ?? process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY environment variable is required');
  }

  const youtube = google.youtube({ version: 'v3', auth: apiKey });

  const quotaLimit = Number.parseInt(
    String(config?.quotaLimit ?? process.env.YOUTUBE_QUOTA_LIMIT ?? '10000'),
    10
  );
  const quotaBuffer = Number.parseInt(
    String(
      config?.quotaBuffer ?? process.env.YOUTUBE_RATE_LIMIT_BUFFER ?? '500'
    ),
    10
  );
  const quotaResetHour = Number.parseInt(
    String(
      config?.quotaResetHour ?? process.env.YOUTUBE_QUOTA_RESET_HOUR ?? '0'
    ),
    10
  );

  return { youtube, quotaLimit, quotaBuffer, quotaResetHour };
}
