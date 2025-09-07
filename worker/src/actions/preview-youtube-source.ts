import type { SourceBase } from "../types/sources.js";
import { quotaTracker } from "../utils/quota-tracker.js";
import { fetchYouTubeChannelVideos } from "./fetch-youtube-channel-videos.js";
import { fetchYouTubeSearchVideos } from "./fetch-youtube-search-videos.js";
import { resolveYouTubeUploadsId } from "./resolve-youtube-uploads-id.js";

const DEFAULT_MAX_VIDEOS = 10;
const DAYS_LOOKBACK = 7;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

export async function previewYouTubeSourceAction(
  src: SourceBase,
  limit = DEFAULT_MAX_VIDEOS
) {
  if (src.kind === "youtube_channel") {
    const metadata = (src.metadata ?? {}) as Record<string, unknown>;
    const maxResults = Math.min(
      parsePositiveInt(metadata.max_videos_per_run, DEFAULT_MAX_VIDEOS),
      limit
    );
    const publishedAfter = new Date(
      Date.now() - DAYS_LOOKBACK * MS_PER_DAY
    ).toISOString();
    const uploadsPlaylistId = await resolveYouTubeUploadsId({
      sourceId: src.id,
      url: src.url || undefined,
      name: src.name || undefined,
      currentUploadsPlaylistId:
        (metadata.upload_playlist_id as string | undefined) || undefined,
    });
    const videos = await fetchYouTubeChannelVideos({
      uploadsPlaylistId,
      maxResults,
      publishedAfter,
    });
    return {
      items: videos.slice(0, limit).map(toPreviewItem),
      quota: quotaTracker.checkQuotaStatus(),
    };
  }
  if (src.kind === "youtube_search") {
    const metadata = (src.metadata ?? {}) as Record<string, unknown>;
    const query = typeof metadata.query === "string" ? metadata.query : "";
    const maxResults = Math.min(
      parsePositiveInt(metadata.max_results, DEFAULT_MAX_VIDEOS),
      limit
    );
    const publishedAfter =
      parseOptionalString(metadata.published_after) ||
      new Date(Date.now() - DAYS_LOOKBACK * MS_PER_DAY).toISOString();
    const order = parseOrder(metadata.order);
    const duration = parseDuration(metadata.duration);
    const videos = await fetchYouTubeSearchVideos({
      query,
      maxResults,
      publishedAfter,
      order,
      duration,
    });
    return {
      items: videos.slice(0, limit).map(toPreviewItem),
      quota: quotaTracker.checkQuotaStatus(),
    };
  }
  throw new Error(`Unsupported kind for preview: ${src.kind}`);
}

function toPreviewItem(v: {
  title: string;
  videoId: string;
  publishedAt: string;
}) {
  return {
    title: v.title,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    external_id: v.videoId,
    published_at: v.publishedAt,
  };
}

type SearchOrder = "date" | "relevance" | "viewCount";
type SearchDuration = "short" | "medium" | "long" | "any" | undefined;

function parseOrder(value: unknown): SearchOrder {
  const allowed: SearchOrder[] = ["date", "relevance", "viewCount"];
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as SearchOrder)
    : "relevance";
}

function parseDuration(value: unknown): SearchDuration {
  const allowed = new Set(["short", "medium", "long", "any"]);
  return typeof value === "string" && allowed.has(value)
    ? (value as SearchDuration)
    : undefined;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return fallback;
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}
