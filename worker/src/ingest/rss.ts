import { XMLParser } from 'fast-xml-parser';
import PgBoss from 'pg-boss';
import { getRssSources, upsertRawItem } from '../db.js';
import { canonicalizeUrl } from '../util.js';

type RssItem = {
  guid?: string | { '#text'?: string };
  id?: string; // atom
  link?: string | { href?: string };
  title?: string;
  pubDate?: string;
  updated?: string; // atom
};

function getText(v: any): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && '#text' in v) return (v['#text'] as string) ?? undefined;
  if (typeof v === 'object' && 'href' in v) return (v['href'] as string) ?? undefined;
  return undefined;
}

function asArray<T>(x: T | T[] | undefined): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

export async function runIngestRss(boss: PgBoss) {
  const sources = await getRssSources();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

  for (const src of sources) {
    try {
      if (!src.url) continue;
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 15_000);
      const res = await fetch(src.url, { redirect: 'follow', signal: ac.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const doc = parser.parse(xml);

      // RSS 2.0: rss.channel.item; Atom: feed.entry
      const items: RssItem[] = asArray(doc?.rss?.channel?.item).concat(asArray(doc?.feed?.entry));
      for (const it of items) {
        const guid = getText(it.guid) || it.id || getText(it.link) || '';
        const link = canonicalizeUrl(getText(it.link) || '');
        if (!guid && !link) continue;
        const external = guid || link;
        const title = it.title ? getText(it.title as any) ?? String(it.title) : null;
        const metadata = {
          pubDate: it.pubDate || it.updated || null,
          src: src.url,
        };
        const id = await upsertRawItem({
          source_id: src.id,
          external_id: external,
          url: link || external,
          title,
          kind: 'article',
          metadata,
        });
        if (id) {
          // new item: enqueue fetch-content
          await boss.send('ingest:fetch-content', { rawItemIds: [id] });
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('rss_ingest_error', src.url, err);
    }
  }
}
