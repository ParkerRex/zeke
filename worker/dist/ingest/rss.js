import { XMLParser } from 'fast-xml-parser';
import { getRssSources, upsertRawItem } from '../db.js';
import { canonicalizeUrl } from '../util.js';
import { log } from '../log.js';
function getText(v) {
    if (v == null)
        return undefined;
    if (typeof v === 'string')
        return v;
    if (typeof v === 'object' && '#text' in v)
        return v['#text'] ?? undefined;
    if (typeof v === 'object' && 'href' in v)
        return v['href'] ?? undefined;
    return undefined;
}
function asArray(x) {
    if (!x)
        return [];
    return Array.isArray(x) ? x : [x];
}
export async function runIngestRss(boss) {
    const sources = await getRssSources();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    for (const src of sources) {
        try {
            if (!src.url)
                continue;
            const t0 = Date.now();
            log('ingest_source_start', { comp: 'ingest', source_id: src.id, url: src.url });
            const ac = new AbortController();
            const timer = setTimeout(() => ac.abort(), 15_000);
            const res = await fetch(src.url, { redirect: 'follow', signal: ac.signal });
            clearTimeout(timer);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const xml = await res.text();
            const doc = parser.parse(xml);
            // RSS 2.0: rss.channel.item; Atom: feed.entry
            const items = asArray(doc?.rss?.channel?.item).concat(asArray(doc?.feed?.entry));
            let seen = 0;
            let newCount = 0;
            for (const it of items) {
                const guid = getText(it.guid) || it.id || getText(it.link) || '';
                const link = canonicalizeUrl(getText(it.link) || '');
                if (!guid && !link)
                    continue;
                seen++;
                const external = guid || link;
                const title = it.title ? getText(it.title) ?? String(it.title) : null;
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
                    newCount++;
                }
            }
            log('ingest_source_done', {
                comp: 'ingest',
                source_id: src.id,
                url: src.url,
                items_seen: seen,
                items_new: newCount,
                duration_ms: Date.now() - t0,
            });
        }
        catch (err) {
            log('rss_ingest_error', { comp: 'ingest', url: src.url, err: String(err) }, 'error');
        }
    }
}
