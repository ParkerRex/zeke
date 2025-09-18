import type { YouTubeVideo } from '../lib/youtube/types.js';

type SourceWithMetadata = {
  id: string;
  url?: string | null;
  metadata?: { query?: string } | null;
};

export function buildDiscoveryYouTube(
  video: YouTubeVideo,
  src: SourceWithMetadata
) {
  const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const srcMeta = (src.metadata as { query?: string } | null) || {};
  const metadata = {
    videoId: video.videoId,
    channelId: video.channelId,
    channelTitle: video.channelTitle,
    publishedAt: video.publishedAt,
    description: video.description,
    duration: video.duration,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    thumbnails: video.thumbnails,
    tags: video.tags,
    categoryId: video.categoryId,
    defaultLanguage: video.defaultLanguage,
    defaultAudioLanguage: video.defaultAudioLanguage,
    src: src.url || `search:${srcMeta?.query}`,
  };

  return {
    source_id: src.id as string,
    external_id: video.videoId,
    url: videoUrl,
    title: video.title,
    kind: 'youtube' as const,
    metadata,
  };
}
