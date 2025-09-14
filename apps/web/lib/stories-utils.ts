/**
 * Shared utilities for story functionality
 */

import type { Cluster } from '@zeke/supabase/types';

// Constants for story components
export const HASH_MULTIPLIER = 31;
export const MIN_COVERAGE_PERCENT = 35;
export const MAX_COVERAGE_PERCENT = 90;
export const COVERAGE_MAX_PERCENT = 100;
export const MIN_SOURCES_COUNT = 3;
export const DEFAULT_STORIES_LIMIT = 6;

/**
 * Generate a deterministic percentage based on story ID
 * Used for coverage bars and other visual indicators
 */
export function deterministicPercent(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash * HASH_MULTIPLIER + char) % COVERAGE_MAX_PERCENT;
  }
  return Math.max(
    MIN_COVERAGE_PERCENT,
    Math.min(MAX_COVERAGE_PERCENT, Math.abs(hash))
  );
}

/**
 * Calculate hype percentage from chili rating
 */
export function hypePercent(cluster: Cluster): number {
  const chili = Number(cluster?.overlays?.chili ?? 0);
  const pct = Math.max(0, Math.min(5, chili)) * 20; // map 0..5 → 0..100
  return pct;
}

/**
 * Get placeholder image for stories
 * TODO: Replace with actual story thumbnails when available
 */
export function imageFor(_story?: Cluster): string {
  return '/hero-shape.png';
}

/**
 * Get human-readable label for story kind
 */
export function getKindLabel(kind: string | undefined): string {
  if (kind === 'youtube') {
    return 'Video';
  }
  if (kind === 'arxiv') {
    return 'Research';
  }
  return 'AI';
}

/**
 * Extract domain from URL for display
 */
export function domainFromUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Generate daily index score based on current date
 * This creates a deterministic but varying score for demo purposes
 */
export function getDailyIndexScore(): {
  score: number;
  sentiment: string;
  bucketLabel: string;
} {
  const today = new Date();
  const seed =
    today.getFullYear() * 10_000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const score = seed % 100; // 0..99

  const labels = ['Negative', 'Neutral', 'Optimistic', 'Positive'] as const;
  const bucket = score < 25 ? 0 : score < 50 ? 1 : score < 75 ? 2 : 3;
  const bucketLabel = labels[bucket];
  const sentiment = score < 33 ? 'Calm' : score < 66 ? 'Serious' : 'Hyped';

  return { score, sentiment, bucketLabel };
}

/**
 * Topic data for navigation and filtering
 */
export const topicsData = {
  columns: [
    {
      title: 'Top Topics',
      links: [
        { label: 'AGI Debate', href: '/stories?q=AGI' },
        {
          label: 'Open‑source Models',
          href: '/stories?q=open-source%20models',
        },
        { label: 'Agentic Workflows', href: '/stories?q=agent%20workflows' },
        {
          label: 'Safety & Governance',
          href: '/stories?q=AI%20safety%20governance',
        },
      ],
    },
    {
      title: 'Trending in AI',
      links: [
        { label: 'Models & Benchmarks', href: '/stories?q=benchmark' },
        { label: 'Tooling & Frameworks', href: '/stories?q=framework%20SDK' },
        {
          label: 'Inference & Serving',
          href: '/stories?q=inference%20serving',
        },
        { label: 'Funding & M&A', href: '/stories?q=funding%20acquisition' },
      ],
    },
    {
      title: 'Research Areas',
      links: [
        { label: 'Language', href: '/stories?q=LLM%20NLP' },
        { label: 'Vision', href: '/stories?q=multimodal%20vision' },
        { label: 'Robotics', href: '/stories?q=robotics' },
        {
          label: 'Reinforcement Learning',
          href: '/stories?q=reinforcement%20learning',
        },
      ],
    },
    {
      title: 'Platforms',
      links: [
        { label: 'OpenAI', href: '/stories?q=OpenAI' },
        { label: 'Anthropic', href: '/stories?q=Anthropic' },
        { label: 'Meta', href: '/stories?q=Meta%20AI' },
        { label: 'DeepMind', href: '/stories?q=DeepMind' },
      ],
    },
  ],
  sidebarItems: [
    { label: 'AGI Debate', href: '/stories?q=AGI' },
    { label: 'Open‑source Models', href: '/stories?q=open-source%20models' },
    { label: 'Markets', href: '/stories?q=markets%20AI' },
    { label: 'Agents', href: '/stories?q=agents' },
  ],
};

/**
 * Sample questions for Ask ZEKE component
 */
export const askZekeQuestions = [
  'What are the top 5 news events today?',
  'Which companies are making headlines this week?',
  'What are the most trending topics?',
];
