import type { ContentItem, ContentSource } from "../types";
import type { RSSFeed, RSSItem } from "./rss-api";

export function transformItemToContent(
  item: RSSItem,
  feed: RSSFeed,
): ContentItem {
  return {
    id: generateItemId(item),
    title: item.title,
    description: item.description,
    url: item.link,
    sourceType: "rss",
    contentType: "article",
    publishedAt: new Date(item.pubDate),
    metadata: {
      guid: item.guid,
      feedTitle: feed.title,
      feedUrl: feed.link,
      author: item.author,
      categories: item.category,
      enclosure: item.enclosure,
    },
    author: item.author
      ? {
          id: item.author.replace(/[^a-zA-Z0-9]/g, "_"),
          name: item.author,
          url: feed.link,
        }
      : undefined,
  };
}

export function transformFeedToSource(
  feed: RSSFeed,
  originalUrl: string,
): ContentSource {
  return {
    id: generateFeedId(originalUrl),
    name: feed.title,
    description: feed.description,
    url: originalUrl,
    sourceType: "rss",
    metadata: {
      feedUrl: originalUrl,
      link: feed.link,
      lastBuildDate: feed.lastBuildDate,
      language: feed.language,
      image: feed.image,
      itemCount: feed.items.length,
    },
    isActive: true,
    lastChecked: new Date(),
  };
}

function generateItemId(item: RSSItem): string {
  // Use GUID if available, otherwise generate from link
  if (item.guid && item.guid !== item.link) {
    return `rss_${item.guid.replace(/[^a-zA-Z0-9]/g, "_")}`;
  }

  const urlParts = item.link.split("/");
  const lastPart =
    urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
  return `rss_${lastPart.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

function generateFeedId(url: string): string {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  return `feed_${domain.replace(/[^a-zA-Z0-9]/g, "_")}`;
}

