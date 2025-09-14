import type { Cluster, EmbedKind, Overlays } from '@zeke/supabase/types';

/**
 * Create a mock story cluster for testing
 */
export function createMockStory(overrides: Partial<Cluster> = {}): Cluster {
  const defaultOverlays: Overlays = {
    whyItMatters: 'This is why this story matters for testing',
    chili: 3,
    confidence: 85,
    sources: [
      {
        title: 'Test Source 1',
        url: 'https://example.com/source1',
        domain: 'example.com',
      },
      {
        title: 'Test Source 2',
        url: 'https://test.com/source2',
        domain: 'test.com',
      },
    ],
  };

  return {
    id: 'test-story-id',
    title: 'Test Story Title',
    primaryUrl: 'https://example.com/story',
    embedKind: 'article' as EmbedKind,
    embedUrl: 'https://example.com/embed',
    overlays: defaultOverlays,
    youtubeMetadata: undefined,
    ...overrides,
  };
}

/**
 * Create multiple mock stories for testing grids/lists
 */
export function createMockStories(
  count: number,
  baseOverrides: Partial<Cluster> = {}
): Cluster[] {
  return Array.from({ length: count }, (_, index) =>
    createMockStory({
      id: `test-story-${index}`,
      title: `Test Story ${index + 1}`,
      primaryUrl: `https://example.com/story-${index}`,
      ...baseOverrides,
    })
  );
}

/**
 * Create a mock story with specific embed kind
 */
export function createMockStoryWithKind(
  kind: EmbedKind,
  overrides: Partial<Cluster> = {}
): Cluster {
  const kindSpecificData: Partial<Cluster> = {};

  if (kind === 'youtube') {
    kindSpecificData.youtubeMetadata = {
      transcriptUrl: 'https://youtube.com/transcript',
      transcriptVtt: 'WEBVTT\n\n00:00.000 --> 00:05.000\nTest transcript',
      durationSeconds: 300,
      viewCount: 1000,
    };
  }

  return createMockStory({
    embedKind: kind,
    ...kindSpecificData,
    ...overrides,
  });
}

/**
 * Create a mock story with specific chili rating for hype testing
 */
export function createMockStoryWithChili(
  chili: number,
  overrides: Partial<Cluster> = {}
): Cluster {
  return createMockStory({
    overlays: {
      whyItMatters: 'Test story with specific chili rating',
      chili,
      confidence: 85,
      sources: [],
    },
    ...overrides,
  });
}
