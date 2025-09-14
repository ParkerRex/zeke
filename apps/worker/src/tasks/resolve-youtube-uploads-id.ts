import { updateSourceMetadata } from '../db.js';
import { searchChannels } from '../lib/youtube/search-channels.js';
import { createYouTubeClient } from '../lib/youtube/youtube-client.js';
import { log } from '../log.js';

const YOUTUBE_HANDLE_REGEX = /@([A-Za-z0-9_\-.]+)/;

export async function resolveYouTubeUploadsId(input: {
  sourceId: string;
  url?: string | null;
  name?: string | null;
  currentUploadsPlaylistId?: string | null;
}): Promise<string> {
  // If we already have an ID, prefer it (validation happens when fetching videos)
  if (input.currentUploadsPlaylistId) {
    return input.currentUploadsPlaylistId;
  }

  const client = createYouTubeClient();
  let query = '';
  if (typeof input.url === 'string' && input.url.includes('youtube.com/')) {
    const match = input.url.match(YOUTUBE_HANDLE_REGEX);
    if (match) {
      query = match[1];
    }
  }
  if (!query && typeof input.name === 'string') {
    query = input.name;
  }

  log('youtube_derive_uploads_id_start', { source_id: input.sourceId, query });
  const candidates = await searchChannels(client, query);
  const chosen = candidates[0];
  if (!chosen?.uploadsPlaylistId) {
    throw new Error(
      `Could not derive uploads playlist id for source ${input.sourceId}`
    );
  }

  // Persist for next runs
  try {
    await updateSourceMetadata(input.sourceId, {
      upload_playlist_id: chosen.uploadsPlaylistId,
    });
  } catch (e) {
    log(
      'youtube_derive_uploads_id_persist_error',
      { source_id: input.sourceId, err: String(e) },
      'warn'
    );
  }

  log('youtube_derive_uploads_id_success', {
    source_id: input.sourceId,
    uploadsPlaylistId: chosen.uploadsPlaylistId,
  });
  return chosen.uploadsPlaylistId;
}
