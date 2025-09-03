import type { Cluster } from "@/features/stories";

export const sampleClusters: Cluster[] = [
  {
    id: "clu_123",
    title: "Mistral releases 8x7B",
    primaryUrl: "https://mistral.ai/news/",
    embedKind: "article",
    embedUrl: "https://mistral.ai/news/",
    overlays: {
      whyItMatters: "Open weights shift the competitive moat and speed up adoption.",
      chili: 4,
      confidence: 0.72,
      sources: [
        { title: "Reuters", url: "https://reuters.com/...", domain: "reuters.com" },
        { title: "HN thread", url: "https://news.ycombinator.com/item?id=...", domain: "news.ycombinator.com" },
      ],
    },
  },
  {
    id: "clu_yt_001",
    title: "YouTube creators react to AI agents",
    primaryUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    embedKind: "youtube",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?modestbranding=1&rel=0",
    overlays: {
      whyItMatters: "Early adopter sentiment shows strong interest and concerns.",
      chili: 3,
      confidence: 0.6,
      sources: [
        { title: "YT Video", url: "https://youtube.com/watch?v=dQw4w9WgXcQ", domain: "youtube.com" },
      ],
    },
  },
];

