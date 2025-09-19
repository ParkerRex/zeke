import { XMLParser } from 'fast-xml-parser';

export type RssItem = {
  guid?: string | { '#text'?: string };
  id?: string; // atom
  link?: string | { href?: string };
  title?: string;
  pubDate?: string;
  updated?: string; // atom
};

export function parseRssFeed(xml: string): RssItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });
  const doc = parser.parse(xml);
  const items: RssItem[] = asArray(doc?.rss?.channel?.item).concat(
    asArray(doc?.feed?.entry)
  );
  return items;
}

function asArray<T>(x: T | T[] | undefined): T[] {
  if (!x) {
    return [];
  }
  return Array.isArray(x) ? x : [x];
}
