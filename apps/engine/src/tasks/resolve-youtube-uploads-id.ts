import { updateSourceMetadata } from '../db.js';
import { log } from '../log.js';

const PLAYLIST_ID_REGEX = /[?&]list=([A-Za-z0-9_-]+)/;

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

  const playlistIdFromUrl = extractPlaylistIdFromUrl(input.url);
  if (playlistIdFromUrl) {
    await persistUploadsPlaylistId(input.sourceId, playlistIdFromUrl);
    return playlistIdFromUrl;
  }

  throw new Error(
    'youtube_uploads_playlist_unavailable: provide upload_playlist_id metadata now that Google Cloud integration has been removed.'
  );
}

function extractPlaylistIdFromUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }

  const match = url.match(PLAYLIST_ID_REGEX);
  if (match?.[1]) {
    return match[1];
  }

  return null;
}

async function persistUploadsPlaylistId(
  sourceId: string,
  uploadsPlaylistId: string
) {
  try {
    await updateSourceMetadata(sourceId, {
      upload_playlist_id: uploadsPlaylistId,
    });
    log('youtube_uploads_id_persisted', {
      source_id: sourceId,
      uploadsPlaylistId,
    });
  } catch (error) {
    log(
      'youtube_uploads_id_persist_error',
      { source_id: sourceId, error: String(error) },
      'warn'
    );
  }
}
