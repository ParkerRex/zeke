import type { ContentItem, ContentSource } from "../types";
import type { EpisodeData, PodcastData } from "./apple-podcasts-api";

export function transformEpisodeToContent(
  episode: EpisodeData,
  podcastId: string,
  originalUrl: string,
): ContentItem {
  return {
    id: episode.id,
    title: episode.title,
    description: episode.description,
    url: originalUrl,
    sourceType: "podcast",
    contentType: "audio",
    publishedAt: new Date(episode.publishedAt),
    duration: episode.duration,
    metadata: {
      episodeId: episode.id,
      podcastId,
      podcastName: episode.podcastName,
      podcastAuthor: episode.podcastAuthor,
      episodeUrl: episode.episodeUrl,
      artwork: episode.artworkUrl,
    },
    author: {
      id: podcastId,
      name: episode.podcastAuthor,
      url: `https://podcasts.apple.com/podcast/id${podcastId}`,
    },
  };
}

export function transformPodcastToSource(podcast: PodcastData): ContentSource {
  return {
    id: podcast.id,
    name: podcast.name,
    description: podcast.description,
    url: `https://podcasts.apple.com/podcast/id${podcast.id}`,
    sourceType: "podcast",
    metadata: {
      podcastId: podcast.id,
      author: podcast.author,
      feedUrl: podcast.feedUrl,
      artwork: podcast.artworkUrl,
      genres: podcast.genres,
      episodeCount: podcast.episodeCount,
    },
    isActive: true,
    lastChecked: new Date(),
  };
}