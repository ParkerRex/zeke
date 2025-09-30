import type {
  StoryClusterRecord,
  StoryClusterStory,
} from "@db/src/queries/story-clusters";

export type StorySource = {
  title: string;
  url: string;
  domain: string;
};

export type StoryOverlaySummary = {
  whyItMatters: string | null;
  chili: number;
  confidence: number | null;
  sources: StorySource[];
};

export type StoryEmbedKind =
  | "article"
  | "youtube"
  | "podcast"
  | "arxiv"
  | "twitter"
  | "video"
  | "pdf";

export type StoryClusterView = {
  id: string;
  clusterId: string | null;
  title: string | null;
  summary: string | null;
  primaryUrl: string | null;
  embedKind: StoryEmbedKind;
  embedUrl: string | null;
  overlays: StoryOverlaySummary;
  publishedAt: string | null;
  createdAt: string;
};

export type StoryClusterSummary = {
  id: string;
  clusterKey: string;
  label: string | null;
  primaryStoryId: string | null;
};

const EMBED_KIND_MAP: Record<string, StoryEmbedKind> = {
  article: "article",
  video: "youtube",
  podcast: "podcast",
  pdf: "arxiv",
  tweet: "twitter",
};

function toEmbedKind(kind: string | null): StoryEmbedKind {
  if (!kind) {
    return "article";
  }

  return EMBED_KIND_MAP[kind] ?? "article";
}

function normalizeCitations(input: unknown): StorySource[] {
  if (!input) {
    return [];
  }

  const entries: StorySource[] = [];
  const pushSource = (value: unknown) => {
    if (!value || typeof value !== "object") {
      return;
    }

    const record = value as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url : "";
    const title = typeof record.title === "string" ? record.title : "Source";

    const domain =
      typeof record.domain === "string" && record.domain.length > 0
        ? record.domain
        : url
          ? domainFromUrl(url)
          : "unknown";

    entries.push({
      title,
      url,
      domain,
    });
  };

  if (Array.isArray(input)) {
    input.forEach(pushSource);
    return entries;
  }

  if (typeof input === "object") {
    Object.values(input as Record<string, unknown>).forEach(pushSource);
  }

  return entries;
}

function toChili(confidence: unknown): number {
  const value =
    typeof confidence === "number" ? confidence : Number(confidence);
  if (Number.isFinite(value)) {
    const scaled = value * 5;
    return Math.max(0, Math.min(5, Math.round(scaled)));
  }

  return 0;
}

function domainFromUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    const parts = hostname.split(".");
    if (parts.length <= 2) {
      return hostname;
    }

    return parts.slice(-2).join(".");
  } catch {
    return "unknown";
  }
}

export function mapStoryClusterStoryToView(
  story: StoryClusterStory,
): StoryClusterView {
  const overlay = story.overlay ?? null;
  const sources = normalizeCitations(overlay?.citations);
  const confidence =
    overlay?.confidence === null || overlay?.confidence === undefined
      ? null
      : Number(overlay.confidence);

  const chili = toChili(confidence ?? 0);

  const embedKind = toEmbedKind(story.kind);
  const embedUrl = story.primaryUrl ?? null;

  return {
    id: story.id,
    clusterId: story.clusterId ?? null,
    title: story.title ?? null,
    summary: story.summary ?? null,
    primaryUrl: story.primaryUrl ?? null,
    embedKind,
    embedUrl,
    overlays: {
      whyItMatters: overlay?.whyItMatters ?? null,
      chili,
      confidence,
      sources,
    },
    publishedAt: story.publishedAt ?? null,
    createdAt: story.createdAt,
  } satisfies StoryClusterView;
}

export function mapStoryClusterRecordToSummary(
  cluster: StoryClusterRecord,
): StoryClusterSummary {
  return {
    id: cluster.id,
    clusterKey: cluster.clusterKey,
    label: cluster.label ?? null,
    primaryStoryId: cluster.primaryStoryId ?? null,
  } satisfies StoryClusterSummary;
}
