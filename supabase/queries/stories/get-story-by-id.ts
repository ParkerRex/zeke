import { sampleClusters } from "@/fixtures/stories/sample-clusters";
import { supabaseAdminClient } from "@/libs/supabase/supabase-admin";
import type { Cluster } from "@/types/stories";
import { mapKindToEmbedKind, parseCitations } from "@/utils/stories/transform";

type StoryWithRelations = {
  id: string;
  title: string | null;
  primary_url: string | null;
  canonical_url: string | null;
  kind: string | null;
  story_overlays: {
    why_it_matters: string | null;
    chili: number | null;
    confidence: number | null;
    citations: unknown;
  } | Array<{
    why_it_matters: string | null;
    chili: number | null;
    confidence: number | null;
    citations: unknown;
  }> | null;
  contents: {
    transcript_url: string | null;
    transcript_vtt: string | null;
    duration_seconds: number | null;
    view_count: number | null;
  } | Array<{
    transcript_url: string | null;
    transcript_vtt: string | null;
    duration_seconds: number | null;
    view_count: number | null;
  }> | null;
};

function extractFirstItem<T>(data: T | T[] | null): T | null {
  if (!data) {
    return null;
  }
  return Array.isArray(data) ? data[0] : data;
}

function buildEmbedUrl(
  story: { kind: string | null; primary_url: string | null; canonical_url: string | null },
  content: { transcript_url?: string | null } | null
): string {
  if (story.kind === "youtube" && content?.transcript_url) {
    const videoId = content.transcript_url.replace("youtube://", "");
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return story.primary_url || story.canonical_url || "";
}

function buildYoutubeMetadata(
  kind: string | null,
  content: {
    transcript_url?: string | null;
    transcript_vtt?: string | null;
    duration_seconds?: number | null;
    view_count?: number | null;
  } | null
) {
  if (kind !== "youtube" || !content) {
    return;
  }

  return {
    transcriptUrl: content.transcript_url || undefined,
    transcriptVtt: content.transcript_vtt || undefined,
    durationSeconds: content.duration_seconds || undefined,
    viewCount: content.view_count || undefined,
  };
}

function transformStoryToCluster(story: StoryWithRelations): Cluster {
  const overlay = extractFirstItem(story.story_overlays);
  const content = extractFirstItem(story.contents);
  const embedUrl = buildEmbedUrl(story, content);

  return {
    id: story.id,
    title: story.title || "Untitled Story",
    primaryUrl: story.primary_url || story.canonical_url || "",
    embedKind: mapKindToEmbedKind(story.kind),
    embedUrl,
    overlays: {
      whyItMatters: overlay?.why_it_matters || "Analysis pending...",
      chili: overlay?.chili || 0,
      confidence: overlay?.confidence || 0,
      sources: parseCitations(overlay?.citations) || [],
    },
    youtubeMetadata: buildYoutubeMetadata(story.kind, content),
  };
}

export async function getStoryById(id: string): Promise<Cluster | undefined> {
  try {
    const { data: story, error } = await supabaseAdminClient
      .from("stories")
      .select(
        `
        id,
        title,
        canonical_url,
        primary_url,
        kind,
        created_at,
        story_overlays (
          why_it_matters,
          chili,
          confidence,
          citations
        ),
        contents (
          transcript_url,
          transcript_vtt,
          duration_seconds,
          view_count
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !story) {
      return sampleClusters.find((c) => c.id === id);
    }

    return transformStoryToCluster(story);
  } catch {
    return sampleClusters.find((c) => c.id === id);
  }
}

// helpers moved to '@/utils/stories/transform'
