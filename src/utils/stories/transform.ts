import type { Cluster } from "@/types/stories";

export function mapKindToEmbedKind(kind: string | null): Cluster["embedKind"] {
  switch (kind) {
    case "article":
      return "article";
    case "youtube":
      return "youtube";
    case "reddit":
      return "reddit";
    case "hn":
      return "hn";
    case "podcast":
      return "podcast";
    case "arxiv":
      return "arxiv";
    case "twitter":
      return "twitter";
    default:
      return "article";
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

export function parseCitations(
  citations: unknown
): Array<{ title: string; url: string; domain: string }> {
  if (!(citations && Array.isArray(citations))) {
    return [];
  }
  try {
    return (citations as unknown[]).map((raw) => {
      const obj: Record<string, unknown> =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

      const title =
        typeof obj.title === "string" ? (obj.title as string) : "Source";
      const url = typeof obj.url === "string" ? (obj.url as string) : "";

      let domain =
        typeof obj.domain === "string" && obj.domain
          ? (obj.domain as string)
          : "unknown";

      if (domain === "unknown" && url) {
        domain = extractDomain(url);
      }

      return { title, url, domain };
    });
  } catch {
    return [];
  }
}
