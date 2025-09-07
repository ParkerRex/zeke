import type { YouTubeVideo } from "../lib/youtube/types.js";

type SourceWithMetadata = {
  id: string;
  url?: string | null;
  metadata?: { query?: string } | null;
};

export function buildRawItemYouTube(
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
    duration: video.duration,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: (video as any).commentCount,
    thumbnails: (video as any).thumbnails,
    tags: (video as any).tags,
    categoryId: (video as any).categoryId,
    defaultLanguage: (video as any).defaultLanguage,
    defaultAudioLanguage: (video as any).defaultAudioLanguage,
    src: src.url || `search:${srcMeta?.query}`,
  };

  return {
    source_id: src.id as string,
    external_id: video.videoId,
    url: videoUrl,
    title: video.title,
    kind: "youtube" as const,
    metadata,
  };
}
