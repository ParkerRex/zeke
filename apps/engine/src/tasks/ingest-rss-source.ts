import type PgBoss from 'pg-boss';
import { upsertDiscovery, upsertSourceHealth } from '../db.js';
import { buildDiscoveryArticle } from '../extract/build-discovery-article.js';
import { normalizeRssItem } from '../extract/normalize-rss-item.js';
import { parseRssFeed } from '../extract/parse-rss-feed.js';
import { log } from '../log.js';
import { fetchWithTimeout } from '../utils/http.js';

const FETCH_TIMEOUT_MS = 15_000;

export async function ingestRssSource(
  boss: PgBoss,
  src: { id: string; url: string }
): Promise<{ seen: number; newCount: number }> {
  const t0 = Date.now();
  log('ingest_source_start', {
    comp: 'ingest',
    kind: 'rss',
    source_id: src.id,
    url: src.url,
  });

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
  let seen = 0;
  let newCount = 0;

  for (const it of items) {
    const norm = normalizeRssItem(it, src.url);
    if (!norm) {
      continue;
    }
    seen++;
    const payload = buildDiscoveryArticle(norm, src.id);
    const id = await upsertDiscovery(payload);
    if (id) {
      await boss.send('ingest:fetch-content', { rawItemIds: [id] });
      newCount++;
    }
  }

  await upsertSourceHealth(src.id, 'ok', null);
  log('ingest_source_done', {
    comp: 'ingest',
    kind: 'rss',
    source_id: src.id,
    url: src.url,
    items_seen: seen,
    items_new: newCount,
    duration_ms: Date.now() - t0,
  });
  return { seen, newCount };
}
