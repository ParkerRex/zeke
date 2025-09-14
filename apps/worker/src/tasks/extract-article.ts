import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import type PgBoss from 'pg-boss';
import {
  findRawItemsByIds,
  findStoryIdByContentHash,
  insertContents,
  insertStory,
} from '../db.js';
import { log } from '../log.js';
import { canonicalizeUrl, hashText } from '../util.js';
import { fetchWithTimeout } from '../utils/http.js';

const FETCH_TIMEOUT_MS = 15_000;

export async function extractArticle(
  jobData: { rawItemIds: string[] },
  boss: PgBoss
) {
  const rows = await findRawItemsByIds(jobData.rawItemIds || []);
  for (const row of rows) {
    try {
      const t0 = Date.now();
      const resp = await fetchWithTimeout(
        row.url,
        { redirect: 'follow' },
        FETCH_TIMEOUT_MS
      );
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const finalUrl = canonicalizeUrl(resp.url || row.url);
      const html = await resp.text();
      const dom = new JSDOM(html, { url: finalUrl });
      const reader = new Readability(dom.window.document);
      const parsed = reader.parse();
      const text = parsed?.textContent?.trim() || '';
      if (!text) {
        throw new Error('no_text_extracted');
      }

      const content_hash = hashText(text);
      const content_id = await insertContents({
        raw_item_id: row.id,
        text,
        html_url: finalUrl,
        lang: null,
        content_hash,
      });

      const existingStoryId = await findStoryIdByContentHash(content_hash);
      const storyId =
        existingStoryId ??
        (await insertStory({
          content_id,
          title: parsed?.title || row.title || null,
          canonical_url: finalUrl,
          primary_url: finalUrl,
          kind: 'article',
          published_at: null,
        }));

      await boss.send('analyze:llm', { storyId });
      log('extract_success', {
        comp: 'extract',
        raw_item_id: row.id,
        content_id,
        story_id: storyId,
        content_hash,
        url: finalUrl,
        text_len: text.length,
        duration_ms: Date.now() - t0,
      });
    } catch (err) {
      log(
        'extract_error',
        {
          comp: 'extract',
          raw_item_id: row.id,
          url: row.url,
          err: String(err),
        },
        'error'
      );
    }
  }
}
