import { normalizeRssItem } from '../extract/normalize-rss-item.js';
import { parseRssFeed } from '../extract/parse-rss-feed.js';
import { fetchWithTimeout } from '../utils/http.js';

const FETCH_TIMEOUT_MS = 15_000;

export async function previewRssSourceAction(
  src: { id: string; url: string },
  limit = 10
): Promise<{
  items: Array<{ title: string | null; url: string; external_id: string }>;
  quota: null;
}> {
  const res = await fetchWithTimeout(
    src.url,
    { redirect: 'follow' },
    FETCH_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const xml = await res.text();
  const items = parseRssFeed(xml);
  const mapped = items
    .map((it) => normalizeRssItem(it, src.url))
    .filter((x): x is NonNullable<ReturnType<typeof normalizeRssItem>> =>
      Boolean(x)
    )
    .slice(0, limit)
    .map((n) => ({ title: n.title, url: n.url, external_id: n.externalId }))
    .filter((x) => x.url);
  return { items: mapped, quota: null };
}
