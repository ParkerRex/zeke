import type { youtube_v3 } from "googleapis";
import { log } from "../../log.js";
import { withRetry } from "../../utils/retry.js";
import type { YouTubeVideo } from "./types.js";
import type { YouTubeClient } from "./youtube-client.js";

const VIDEO_DETAILS_QUOTA_COST = 1;
const MAX_VIDEOS_PER_REQUEST = 50;
const SAMPLE_VIDEO_IDS_COUNT = 5;

function chunkVideoIds(videoIds: string[]): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += MAX_VIDEOS_PER_REQUEST) {
    chunks.push(videoIds.slice(i, i + MAX_VIDEOS_PER_REQUEST));
  }
  return chunks;
}

function parseVideoItem(item: youtube_v3.Schema$Video): YouTubeVideo | null {
  if (!(item.snippet && item.id)) {
    return null;
  }

  return {
    videoId: item.id,
    title: item.snippet.title || "",
    description: item.snippet.description || "",
    publishedAt: item.snippet.publishedAt || "",
    channelId: item.snippet.channelId || "",
    channelTitle: item.snippet.channelTitle || "",
    thumbnailUrl: item.snippet.thumbnails?.medium?.url || undefined,
    duration: item.contentDetails?.duration || undefined,
    viewCount: item.statistics?.viewCount
      ? Number.parseInt(item.statistics.viewCount, 10)
      : undefined,
    likeCount: item.statistics?.likeCount
      ? Number.parseInt(item.statistics.likeCount, 10)
      : undefined,
  };
}

async function fetchVideoChunk(
  client: YouTubeClient,
  chunk: string[]
): Promise<YouTubeVideo[]> {
  const response = await withRetry(() =>
    client.youtube.videos.list({
      part: ["snippet", "statistics", "contentDetails"],
      id: chunk,
    })
  );

  const videos: YouTubeVideo[] = [];
  for (const item of response.data.items || []) {
    const video = parseVideoItem(item);
    if (video) {
      videos.push(video);
    }
  }
  return videos;
}

export async function getVideoDetails(
  client: YouTubeClient,
  videoIds: string[]
): Promise<YouTubeVideo[]> {
  if (videoIds.length === 0) {
    return [];
  }

  try {
    log("youtube_get_video_details_start", {
      videoCount: videoIds.length,
      videoIds: videoIds.slice(0, SAMPLE_VIDEO_IDS_COUNT),
    });

    const chunks = chunkVideoIds(videoIds);
    const allVideos: YouTubeVideo[] = [];

    for (const chunk of chunks) {
      const videos = await fetchVideoChunk(client, chunk);
      allVideos.push(...videos);
    }

    log("youtube_get_video_details_complete", {
      requestedCount: videoIds.length,
      foundCount: allVideos.length,
      quotaUsed: chunks.length * VIDEO_DETAILS_QUOTA_COST,
    });

    return allVideos;
  } catch (error) {
    log(
      "youtube_get_video_details_error",
      {
        videoCount: videoIds.length,
        error: String(error),
      },
      "error"
    );
    throw error;
  }
}
