import { XMLParser } from "fast-xml-parser";

export type RssItem = {
  guid?: string | { "#text"?: string };
  id?: string;
  link?: string | { href?: string };
  title?: string;
  pubDate?: string;
  updated?: string;
};

export function parseRssFeed(xml: string): RssItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const doc = parser.parse(xml);
  return asArray(doc?.rss?.channel?.item).concat(asArray(doc?.feed?.entry));
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
