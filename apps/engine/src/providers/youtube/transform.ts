import type { ContentItem, ContentSource } from "../types";
import type { YouTubeChannelData, YouTubeVideoData } from "./youtube-api";

export function transformVideoToContent(
  video: YouTubeVideoData,
  originalUrl: string,
): ContentItem {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    url: originalUrl,
    sourceType: "youtube",
    contentType: "video",
    publishedAt: new Date(video.publishedAt),
    duration: parseDuration(video.duration),
    metadata: {
      videoId: video.id,
      channelId: video.channelId,
      channelTitle: video.channelTitle,
      viewCount: Number.parseInt(video.viewCount, 10),
      likeCount: video.likeCount
        ? Number.parseInt(video.likeCount, 10)
        : undefined,
      thumbnail: video.thumbnail,
      transcript: video.transcript,
    },
    author: {
      id: video.channelId,
      name: video.channelTitle,
      url: `https://youtube.com/channel/${video.channelId}`,
    },
  };
}

export function transformChannelToSource(
  channel: YouTubeChannelData,
): ContentSource {
  return {
    id: channel.id,
    name: channel.title,
    description: channel.description,
    url: `https://youtube.com/channel/${channel.id}`,
    sourceType: "youtube",
    metadata: {
      channelId: channel.id,
      subscriberCount: Number.parseInt(channel.subscriberCount, 10),
      videoCount: Number.parseInt(channel.videoCount, 10),
      thumbnail: channel.thumbnail,
    },
    isActive: true,
    lastChecked: new Date(),
  };
}

/**
 * Parse YouTube duration format (PT4M13S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}
