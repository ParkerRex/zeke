import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } as any,
  keepAlive: true,
  max: 3,
  connectionTimeoutMillis: 10_000,
});

// Prevent process crashes from idle client errors (e.g., Supabase pooler resets)
// See: https://node-postgres.com/features/connecting#idle-clients
pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('pg_pool_error', err);
});

export type SourceRow = {
  id: string;
  kind: string;
  url: string | null;
  name: string | null;
};

export async function getRssSources(): Promise<SourceRow[]> {
  const { rows } = await pool.query(
    `select id, kind, url, name from public.sources where kind = 'rss' and url is not null`
  );
  return rows;
}

export async function upsertRawItem(params: {
  source_id: string;
  external_id: string;
  url: string;
  title?: string | null;
  kind?: string | null;
  metadata?: any;
}): Promise<string | null> {
  const { source_id, external_id, url, title, kind, metadata } = params;
  const { rows } = await pool.query(
    `insert into public.raw_items (source_id, external_id, url, title, kind, metadata)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (source_id, external_id) do nothing
     returning id`,
    [source_id, external_id, url, title ?? null, kind ?? 'article', metadata ?? null]
  );
  return rows[0]?.id ?? null;
}

export async function findRawItemsByIds(
  ids: string[]
): Promise<Array<{ id: string; url: string; title: string | null }>> {
  if (!ids.length) return [];
  const { rows } = await pool.query(`select id, url, title from public.raw_items where id = any($1::uuid[])`, [ids]);
  return rows;
}

export async function insertContents(params: {
  raw_item_id: string;
  text: string;
  html_url?: string | null;
  lang?: string | null;
  content_hash: string;
}): Promise<string> {
  const { raw_item_id, text, html_url, lang, content_hash } = params;
  const { rows } = await pool.query(
    `insert into public.contents (raw_item_id, text, html_url, lang, content_hash)
     values ($1,$2,$3,$4,$5)
     returning id`,
    [raw_item_id, text, html_url ?? null, lang ?? null, content_hash]
  );
  return rows[0].id as string;
}

export async function findStoryIdByContentHash(hash: string): Promise<string | null> {
  const { rows } = await pool.query(
    `select s.id
       from public.stories s
       join public.contents c on c.id = s.content_id
      where c.content_hash = $1
      limit 1`,
    [hash]
  );
  return rows[0]?.id ?? null;
}

export async function insertStory(params: {
  content_id: string;
  title?: string | null;
  canonical_url?: string | null;
  primary_url?: string | null;
  kind?: string | null;
  published_at?: string | null;
}): Promise<string> {
  const { content_id, title, canonical_url, primary_url, kind, published_at } = params;
  const { rows } = await pool.query(
    `insert into public.stories (content_id, title, canonical_url, primary_url, kind, published_at)
     values ($1,$2,$3,$4,$5,$6)
     returning id`,
    [content_id, title ?? null, canonical_url ?? null, primary_url ?? null, kind ?? 'article', published_at ?? null]
  );
  return rows[0].id as string;
}

export default pool;
