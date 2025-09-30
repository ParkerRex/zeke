import { eq, sql } from "drizzle-orm";
import type { Database } from "@db/client";
import { contents } from "@db/schema";

export function createContentQueries(db: Database) {
  return {
    /**
     * Insert content for a raw item
     */
    async insertContent(params: {
      raw_item_id: string;
      text_body: string;
      html_url?: string | null;
      pdf_url?: string | null;
      audio_url?: string | null;
      content_type?: string;
      language_code?: string | null;
      content_hash?: string | null;
      transcript_url?: string | null;
      transcript_vtt?: string | null;
      duration_seconds?: number | null;
      view_count?: number | null;
    }): Promise<string> {
      const {
        raw_item_id,
        text_body,
        html_url,
        pdf_url,
        audio_url,
        content_type,
        language_code,
        content_hash,
        transcript_url,
        transcript_vtt,
        duration_seconds,
        view_count,
      } = params;

      const result = await db
        .insert(contents)
        .values({
          raw_item_id,
          text_body,
          content_type: content_type ?? "text",
          html_url: html_url ?? undefined,
          pdf_url: pdf_url ?? undefined,
          audio_url: audio_url ?? undefined,
          language_code: language_code ?? undefined,
          content_hash: content_hash ?? undefined,
          transcript_url: transcript_url ?? undefined,
          transcript_vtt: transcript_vtt ?? undefined,
          duration_seconds: duration_seconds ?? undefined,
          view_count: view_count ?? undefined,
        })
        .returning({ id: contents.id });

      return result[0].id;
    },

    /**
     * Get content by raw item ID
     */
    async getContentByRawItemId(rawItemId: string) {
      const result = await db
        .select()
        .from(contents)
        .where(eq(contents.raw_item_id, rawItemId))
        .limit(1);

      return result[0] ?? null;
    },

    /**
     * Get content by ID
     */
    async getContentById(id: string) {
      const result = await db
        .select()
        .from(contents)
        .where(eq(contents.id, id))
        .limit(1);

      return result[0] ?? null;
    },

    /**
     * Check if content exists for a raw item
     */
    async hasContentForRawItem(rawItemId: string): Promise<boolean> {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(contents)
        .where(eq(contents.raw_item_id, rawItemId));

      return result[0].count > 0;
    },
  };
}
