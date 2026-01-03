import { eq, sql } from "drizzle-orm";
import type { Database } from "@db/client";
import { contents } from "@db/schema";

export function createContentQueries(db: Database) {
  return {
    /**
     * Insert content for a raw item
     */
    async insertContent(params: {
      rawItemId: string;
      textBody: string;
      htmlUrl?: string | null;
      pdfUrl?: string | null;
      audioUrl?: string | null;
      contentType?: string;
      languageCode?: string | null;
      contentHash?: string | null;
      transcriptUrl?: string | null;
      transcriptVtt?: string | null;
      durationSeconds?: number | null;
      viewCount?: number | null;
    }): Promise<string> {
      const {
        rawItemId,
        textBody,
        htmlUrl,
        pdfUrl,
        audioUrl,
        contentType,
        languageCode,
        contentHash,
        transcriptUrl,
        transcriptVtt,
        durationSeconds,
        viewCount,
      } = params;

      const result = await db
        .insert(contents)
        .values({
          raw_item_id: rawItemId,
          text_body: textBody,
          content_type: contentType ?? "text",
          html_url: htmlUrl ?? null,
          pdf_url: pdfUrl ?? null,
          audio_url: audioUrl ?? null,
          language_code: languageCode ?? null,
          content_hash: contentHash ?? "",
          transcript_url: transcriptUrl ?? null,
          transcript_vtt: transcriptVtt ?? null,
          duration_seconds: durationSeconds ?? null,
          view_count: viewCount ?? null,
        })
        .returning({ id: contents.id });

      if (!result || result.length === 0) {
        throw new Error("Failed to create content record");
      }

      return result[0]!.id;
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

      return (result[0]?.count ?? 0) > 0;
    },
  };
}
