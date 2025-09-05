import { Pool } from 'pg';
import { log } from './log.js';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    keepAlive: true,
    max: 3,
    connectionTimeoutMillis: 10_000,
});
// Prevent process crashes from idle client errors (e.g., Supabase pooler resets)
// See: https://node-postgres.com/features/connecting#idle-clients
pool.on('error', (err) => {
    log('pg_pool_error', { err: String(err) }, 'warn');
});
export async function getRssSources() {
    const { rows } = await pool.query(`select id, kind, url, name from public.sources where kind = 'rss' and url is not null`);
    return rows;
}
export async function upsertRawItem(params) {
    const { source_id, external_id, url, title, kind, metadata } = params;
    const { rows } = await pool.query(`insert into public.raw_items (source_id, external_id, url, title, kind, metadata)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (source_id, external_id) do nothing
     returning id`, [source_id, external_id, url, title ?? null, kind ?? 'article', metadata ?? null]);
    return rows[0]?.id ?? null;
}
export async function findRawItemsByIds(ids) {
    if (!ids.length)
        return [];
    const { rows } = await pool.query(`select id, url, title from public.raw_items where id = any($1::uuid[])`, [ids]);
    return rows;
}
export async function insertContents(params) {
    const { raw_item_id, text, html_url, lang, content_hash } = params;
    const { rows } = await pool.query(`insert into public.contents (raw_item_id, text, html_url, lang, content_hash)
     values ($1,$2,$3,$4,$5)
     returning id`, [raw_item_id, text, html_url ?? null, lang ?? null, content_hash]);
    return rows[0].id;
}
export async function findStoryIdByContentHash(hash) {
    const { rows } = await pool.query(`select s.id
       from public.stories s
       join public.contents c on c.id = s.content_id
      where c.content_hash = $1
      limit 1`, [hash]);
    return rows[0]?.id ?? null;
}
export async function insertStory(params) {
    const { content_id, title, canonical_url, primary_url, kind, published_at } = params;
    const { rows } = await pool.query(`insert into public.stories (content_id, title, canonical_url, primary_url, kind, published_at)
     values ($1,$2,$3,$4,$5,$6)
     returning id`, [content_id, title ?? null, canonical_url ?? null, primary_url ?? null, kind ?? 'article', published_at ?? null]);
    return rows[0].id;
}
export async function getStoryWithContent(storyId) {
    const { rows } = await pool.query(`select s.id, s.title, s.canonical_url, c.text, c.content_hash
     from public.stories s
     join public.contents c on c.id = s.content_id
     where s.id = $1`, [storyId]);
    return rows[0] ?? null;
}
export async function upsertStoryOverlay(params) {
    const { story_id, why_it_matters, chili, confidence, citations, model_version } = params;
    await pool.query(`insert into public.story_overlays (story_id, why_it_matters, chili, confidence, citations, model_version, analyzed_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (story_id) do update set
       why_it_matters = excluded.why_it_matters,
       chili = excluded.chili,
       confidence = excluded.confidence,
       citations = excluded.citations,
       model_version = excluded.model_version,
       analyzed_at = excluded.analyzed_at`, [story_id, why_it_matters ?? null, chili ?? null, confidence ?? null, citations ?? null, model_version ?? null]);
}
export async function upsertStoryEmbedding(params) {
    const { story_id, embedding, model_version } = params;
    await pool.query(`insert into public.story_embeddings (story_id, embedding, model_version)
     values ($1, $2, $3)
     on conflict (story_id) do update set
       embedding = excluded.embedding,
       model_version = excluded.model_version`, [story_id, JSON.stringify(embedding), model_version ?? null]);
}
export default pool;
