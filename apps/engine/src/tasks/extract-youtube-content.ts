import type PgBoss from 'pg-boss';
import { log } from '../log.js';

export type YouTubeExtractionJobData = {
  rawItemIds: string[];
  videoId: string;
  sourceKind: string;
};

export async function extractYouTubeContent(
  jobData: YouTubeExtractionJobData,
  _boss: PgBoss
) {
  log(
    'youtube_extract_disabled',
    {
      rawItemIds: jobData.rawItemIds,
      videoId: jobData.videoId,
      sourceKind: jobData.sourceKind,
      reason: 'google_cloud_integration_removed',
    },
    'warn'
  );
}
