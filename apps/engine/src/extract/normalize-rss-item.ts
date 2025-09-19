import { canonicalizeUrl } from '../util.js';

export type ParsedText =
  | string
  | { '#text'?: string; href?: string }
  | null
  | undefined;

export type RssItem = {
  guid?: string | { '#text'?: string };
  id?: string;
  link?: string | { href?: string };
  title?: string;
  pubDate?: string;
  updated?: string;
};

export type NormalizedRssItem = {
  externalId: string;
  url: string;
  title: string | null;
  pubDate: string | null;
};

export function normalizeRssItem(
  item: RssItem,
  _sourceUrl: string
): NormalizedRssItem | null {
  const guid = getText(item.guid) || item.id || getText(item.link) || '';
  const link = canonicalizeUrl(getText(item.link) || '');
  if (guid === '' && link === '') {
    return null;
  }

  const externalId = guid;
  const url = link || externalId;
  const title = item.title
    ? (getText(item.title as ParsedText) ?? String(item.title))
    : null;
  const pubDate = item.pubDate || item.updated || null;

  return { externalId, url, title, pubDate };
}

function getText(v: ParsedText): string | undefined {
  if (v == null) {
    return;
  }
  if (typeof v === 'string') {
    return v;
  }
  if (typeof v === 'object' && '#text' in v) {
    return v['#text'] as string;
  }
  if (typeof v === 'object' && 'href' in v) {
    return v.href as string;
  }
  return;
}
