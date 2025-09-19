import type PgBoss from 'pg-boss';
import { log } from '../log.js';
import type { SourceBase } from '../types/sources.js';

export async function ingestYouTubeSource(_boss: PgBoss, src: SourceBase) {
  log(
    'ingest_youtube_disabled',
    {
      source_id: src.id,
      kind: src.kind,
      reason: 'google_cloud_integration_removed',
    },
    'warn'
  );
}
