import { XMLParser } from 'fast-xml-parser';
import { getRssSources, getSourceById, upsertRawItem, upsertSourceHealth } from '../db.js';
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
            await upsertSourceHealth(src.id, 'ok', null);
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
            try {
                await upsertSourceHealth(src.id, 'error', String(err));
            }
            catch { }
        }
    }
}
// Preview RSS items for a single source (no writes, no enqueues)
export async function previewRssSource(src, limit = 10) {
    if (!src.url)
        return { items: [], quota: null };
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15_000);
    const res = await fetch(src.url, { redirect: 'follow', signal: ac.signal });
    clearTimeout(timer);
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const doc = parser.parse(xml);
    const items = asArray(doc?.rss?.channel?.item).concat(asArray(doc?.feed?.entry));
    const mapped = items.slice(0, limit).map((it) => {
        const guid = getText(it.guid) || it.id || getText(it.link) || '';
        const link = canonicalizeUrl(getText(it.link) || guid || '');
        const title = it.title ? getText(it.title) ?? String(it.title) : null;
        return { title, url: link || guid, external_id: guid || link };
    }).filter((x) => x.url);
    return { items: mapped, quota: null };
}
export async function runIngestRssForSource(boss, sourceId) {
    const src = await getSourceById(sourceId);
    if (!src || !src.url)
        return;
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    try {
        const t0 = Date.now();
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 15_000);
        const res = await fetch(src.url, { redirect: 'follow', signal: ac.signal });
        clearTimeout(timer);
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const doc = parser.parse(xml);
        const items = asArray(doc?.rss?.channel?.item).concat(asArray(doc?.feed?.entry));
        let newCount = 0;
        for (const it of items) {
            const guid = getText(it.guid) || it.id || getText(it.link) || '';
            const link = canonicalizeUrl(getText(it.link) || '');
            if (!guid && !link)
                continue;
            const title = it.title ? getText(it.title) ?? String(it.title) : null;
            const metadata = { pubDate: it.pubDate || it.updated || null, src: src.url };
            const id = await upsertRawItem({
                source_id: src.id,
                external_id: guid || link,
                url: link || guid,
                title,
                kind: 'article',
                metadata,
            });
            if (id) {
                await boss.send('ingest:fetch-content', { rawItemIds: [id] });
                newCount++;
            }
        }
        log('ingest_source_done', { comp: 'ingest', source_id: src.id, url: src.url, items_new: newCount, duration_ms: Date.now() - t0 });
    }
    catch (err) {
        log('rss_ingest_error', { comp: 'ingest', url: src.url, err: String(err) }, 'error');
    }
}
