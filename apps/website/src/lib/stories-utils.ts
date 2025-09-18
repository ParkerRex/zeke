import type { StoryClusterView } from "./stories";

export const DEFAULT_STORIES_LIMIT = 6;
export const MIN_SOURCES_COUNT = 3;

const HASH_MULTIPLIER = 31;
const MIN_COVERAGE_PERCENT = 35;
const MAX_COVERAGE_PERCENT = 90;

export function deterministicPercent(
  id: string,
  min = MIN_COVERAGE_PERCENT,
  max = MAX_COVERAGE_PERCENT,
) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.floor(
      (hash * HASH_MULTIPLIER + id.charCodeAt(index)) % Number.MAX_SAFE_INTEGER,
    );
  }

  const span = Math.max(0, max - min);
  return min + (hash % (span + 1));
}

export function hypePercent(story: StoryClusterView) {
  const chili = Number(story?.overlays?.chili ?? 0);
  return Math.max(0, Math.min(5, chili)) * 20;
}

export function imageFor(_story?: StoryClusterView) {
  return "/hero-shape.png";
}

export function domainFromUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  try {
    const hostname = new URL(url).hostname;
    const segments = hostname.split(".");
    if (segments.length <= 2) {
      return hostname;
    }

    return segments.slice(-2).join(".");
  } catch {
    return url;
  }
}

export function getKindLabel(kind: string | undefined) {
  switch (kind) {
    case "youtube":
      return "Video";
    case "podcast":
      return "Podcast";
    case "twitter":
      return "Social";
    case "reddit":
      return "Community";
    case "arxiv":
      return "Research";
    case "article":
      return "Article";
    default:
      return "AI";
  }
}

export const askZekeQuestions = [
  "What are the most shared benchmarks this week?",
  "Who just raised a new round in open-source models?",
  "Show me notable Claude Enterprise launches",
  "What are the top agent frameworks gaining traction?",
];

export function getDailyIndexScore() {
  const score = 68;
  const sentiment = score > 66 ? "Optimistic" : score > 33 ? "Neutral" : "Cautious";
  const bucketLabel = score > 66 ? "Momentum building" : score > 33 ? "Holding steady" : "Wait and see";

  return { score, sentiment, bucketLabel };
}

export const topicsData = {
  columns: [
    {
      title: "AI Strategy",
      links: [
        { label: "Operator playbooks", href: "/stories?kind=article" },
        { label: "Growth tactics", href: "/stories?kind=article&q=growth" },
      ],
    },
    {
      title: "Research",
      links: [
        { label: "arXiv highlights", href: "/stories?kind=arxiv" },
        { label: "Benchmarks", href: "/stories?q=benchmark" },
      ],
    },
    {
      title: "Builders",
      links: [
        { label: "Framework updates", href: "/stories?q=framework" },
        { label: "Open source", href: "/stories?q=open" },
      ],
    },
    {
      title: "Markets",
      links: [
        { label: "Funding rounds", href: "/stories?q=raise" },
        { label: "Ecosystem shifts", href: "/stories?q=market" },
      ],
    },
  ],
};
