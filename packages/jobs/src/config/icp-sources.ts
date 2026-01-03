/**
 * Hardcoded ICP (Ideal Customer Profile) Sources
 *
 * V1: No user preferences UI - we hardcode sources for:
 * - AI Engineers
 * - Researchers
 * - Technical Analysts
 *
 * These are the "must-watch" sources that automatically get monitored.
 */

export interface ICPSource {
  type: "youtube_channel" | "rss" | "podcast" | "author";
  url: string;
  name: string;
  authority_score: number; // 0.0-1.0, higher = more authoritative
  keywords: string[]; // For relevance matching
  check_frequency_hours: number; // How often to poll
}

export const ICP_SOURCES: ICPSource[] = [
  // ======================
  // YOUTUBE CHANNELS
  // ======================
  {
    type: "youtube_channel",
    url: "https://www.youtube.com/@Anthropic-ai",
    name: "Anthropic",
    authority_score: 1.0,
    keywords: ["claude", "extended thinking", "agent", "prompt engineering"],
    check_frequency_hours: 6, // Check 4x/day
  },
  {
    type: "youtube_channel",
    url: "https://www.youtube.com/@OpenAI",
    name: "OpenAI",
    authority_score: 1.0,
    keywords: ["gpt", "chatgpt", "openai", "realtime api", "o1"],
    check_frequency_hours: 6,
  },
  {
    type: "youtube_channel",
    url: "https://www.youtube.com/@GoogleDeepMind",
    name: "Google DeepMind",
    authority_score: 0.95,
    keywords: ["gemini", "deepmind", "alphafold", "reinforcement learning"],
    check_frequency_hours: 12,
  },
  {
    type: "youtube_channel",
    url: "https://www.youtube.com/@lexfridman",
    name: "Lex Fridman",
    authority_score: 0.9,
    keywords: ["ai", "machine learning", "research", "interview"],
    check_frequency_hours: 24,
  },

  // ======================
  // RSS FEEDS (Tech News)
  // ======================
  {
    type: "rss",
    url: "https://hnrss.org/newest?points=100",
    name: "Hacker News (100+ points)",
    authority_score: 0.85,
    keywords: ["ai", "ml", "sdk", "api", "framework", "release"],
    check_frequency_hours: 2, // Very active
  },
  {
    type: "rss",
    url: "https://anthropic.com/rss",
    name: "Anthropic Blog",
    authority_score: 1.0,
    keywords: ["claude", "safety", "constitutional ai"],
    check_frequency_hours: 24,
  },
  {
    type: "rss",
    url: "https://openai.com/blog/rss",
    name: "OpenAI Blog",
    authority_score: 1.0,
    keywords: ["gpt", "chatgpt", "dall-e", "api"],
    check_frequency_hours: 24,
  },

  // ======================
  // PODCASTS
  // ======================
  {
    type: "podcast",
    url: "https://podcasts.apple.com/us/podcast/latent-space-the-ai-engineer-podcast/id1674008350",
    name: "Latent Space (AI Engineer Podcast)",
    authority_score: 0.9,
    keywords: ["ai engineering", "llm", "agent", "infrastructure"],
    check_frequency_hours: 48, // Weekly show
  },
  {
    type: "podcast",
    url: "https://podcasts.apple.com/us/podcast/practical-ai-machine-learning-data-science/id1406537385",
    name: "Practical AI",
    authority_score: 0.85,
    keywords: ["machine learning", "production ml", "mlops"],
    check_frequency_hours: 48,
  },

  // ======================
  // ARXIV AUTHORS (Research Papers)
  // ======================
  // Note: arXiv doesn't have per-author RSS, we'll search by keyword instead
];

/**
 * ICP Keywords for Relevance Scoring
 * Stories/highlights matching these keywords get boosted priority
 */
export const ICP_KEYWORDS = [
  // AI/ML Core
  "agent",
  "claude",
  "gpt",
  "llm",
  "large language model",
  "extended thinking",
  "chain of thought",
  "prompt engineering",

  // Technical Implementation
  "sdk",
  "api",
  "breaking change",
  "deprecation",
  "migration",
  "environment variable",
  "configuration",

  // Code/Development
  "code example",
  "implementation",
  "tutorial",
  "git diff",
  "pull request",

  // Performance/Metrics
  "benchmark",
  "latency",
  "throughput",
  "cost",
  "token",

  // Specific Features
  "function calling",
  "tool use",
  "streaming",
  "embeddings",
  "fine-tuning",
  "rag",
  "retrieval",
];

/**
 * Check frequency helper
 * Returns sources that should be checked now based on last_synced_at
 */
export function getSourcesDueForCheck(
  lastSyncedAt: Date | null,
  checkFrequencyHours: number,
): boolean {
  if (!lastSyncedAt) return true; // Never synced, check now

  const hoursSinceSync =
    (Date.now() - lastSyncedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceSync >= checkFrequencyHours;
}
