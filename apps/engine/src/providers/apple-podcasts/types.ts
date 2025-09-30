export interface ApplePodcastsSearchResponse {
  resultCount: number;
  results: ApplePodcastsResult[];
}

export interface ApplePodcastsResult {
  wrapperType: "track" | "collection";
  kind?: "podcast" | "podcast-episode";
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  collectionViewUrl: string;
  feedUrl?: string;
  trackViewUrl: string;
  artworkUrl30?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  collectionPrice?: number;
  trackPrice?: number;
  releaseDate: string;
  collectionExplicitness?: string;
  trackExplicitness?: string;
  trackCount?: number;
  country: string;
  primaryGenreName: string;
  contentAdvisoryRating?: string;
  artworkUrl?: string;
  genreIds?: string[];
  genres?: string[];
  description?: string;
  shortDescription?: string;
  trackTimeMillis?: number;
  episodeUrl?: string;
  episodeFileExtension?: string;
  episodeContentType?: string;
  episodeGuid?: string;
}

export interface PodcastRSSFeed {
  title: string;
  description: string;
  link: string;
  image?: string;
  author?: string;
  episodes: PodcastEpisode[];
}

export interface PodcastEpisode {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  guid: string;
  duration?: string;
  episodeUrl?: string;
  episodeType?: string;
  season?: number;
  episode?: number;
}