export type YouTubeVideo = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl?: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
  // Optionals used by downstream metadata; may be undefined
  commentCount?: number;
  thumbnails?: Record<string, unknown>;
  tags?: string[];
  categoryId?: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
};

export type YouTubeChannel = {
  channelId: string;
  title: string;
  description: string;
  uploadsPlaylistId: string;
};

export type VideoSearchOptions = {
  query: string;
  maxResults?: number;
  publishedAfter?: string;
  order?: "date" | "relevance" | "viewCount";
  duration?: "short" | "medium" | "long" | "any";
};

export type QuotaStatus = {
  used: number;
  remaining: number;
  canProceed: boolean;
};
