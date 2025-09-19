import type { SourceBase } from '../types/sources.js';
import { log } from '../log.js';

export async function previewYouTubeSourceAction(src: SourceBase, _limit = 10) {
  if (src.kind === 'youtube_channel' || src.kind === 'youtube_search') {
    log(
      'youtube_preview_disabled',
      {
        sourceId: src.id,
        kind: src.kind,
        reason: 'google_cloud_integration_removed',
      },
      'warn'
    );

    return {
      items: [],
      quota: null,
      message:
        'YouTube previews are disabled because Google Cloud integrations have been removed.',
    };
  }

  throw new Error(`Unsupported kind for preview: ${src.kind}`);
}
