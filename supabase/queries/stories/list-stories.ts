import { sampleClusters } from "@/fixtures/stories/sample-clusters";
import { supabaseAdminClient } from "@/lib/supabase/supabase-admin";
import type { Database } from "@/lib/supabase/types";
import type { Cluster } from "@/types/stories";
import { mapKindToEmbedKind, parseCitations } from "@/utils/stories/transform";

const STORIES_LIMIT = 50;

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type ContentRow = Database["public"]["Tables"]["contents"]["Row"];
type OverlayRow = Database["public"]["Tables"]["story_overlays"]["Row"];

type StoryWithRelations = StoryRow & {
  story_overlays: Pick<
    OverlayRow,
    "why_it_matters" | "chili" | "confidence" | "citations"
  > | null;
  contents: Pick<
    ContentRow,
    "transcript_url" | "transcript_vtt" | "duration_seconds" | "view_count"
  > | null;
};

function mapStoryToCluster(story: StoryWithRelations): Cluster {
  const overlay = story.story_overlays ?? undefined;
  const content = story.contents ?? undefined;
  const embedUrl = buildEmbedUrl(story, content);

  return {
    id: story.id,
    title: story.title || "Untitled Story",
    primaryUrl: story.primary_url || story.canonical_url || "",
    embedKind: mapKindToEmbedKind(story.kind),
    embedUrl,
    overlays: buildOverlays(overlay),
    youtubeMetadata: buildYoutubeMetadata(story.kind, content),
  };
}

// Nested selects return objects for one-to-one relations; keep optional checks for safety.

function buildEmbedUrl(
  story: StoryWithRelations,
  content: Pick<ContentRow, "transcript_url"> | undefined
): string {
  if (story.kind === "youtube" && content?.transcript_url) {
    const videoId = content.transcript_url.replace("youtube://", "");
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return story.primary_url || story.canonical_url || "";
}

function buildOverlays(
  overlay:
    | Pick<
        OverlayRow,
        "why_it_matters" | "chili" | "confidence" | "citations"
      >
    | undefined
) {
  return {
    whyItMatters: overlay?.why_it_matters || "Analysis pending...",
    chili: overlay?.chili || 0,
    confidence: overlay?.confidence || 0,
    sources: parseCitations(overlay?.citations) || [],
  };
}

function buildYoutubeMetadata(
  kind: string | null,
  content:
    | Pick<
        ContentRow,
        "transcript_url" | "transcript_vtt" | "duration_seconds" | "view_count"
      >
    | undefined
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

export async function listStories(): Promise<Cluster[]> {
  try {
    const { data: stories, error } = await supabaseAdminClient
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
      .returns<StoryWithRelations[]>()
      .order("created_at", { ascending: false })
      .limit(STORIES_LIMIT);

    if (error) {
      // Log error silently and return fallback data
      return sampleClusters;
    }
    if (!stories || stories.length === 0) {
      return sampleClusters;
    }

    const clusters: Cluster[] = stories.map(mapStoryToCluster);

    return clusters;
  } catch {
    // Return fallback data on error
    return sampleClusters;
  }
}

// helpers moved to '@/utils/stories/transform'
