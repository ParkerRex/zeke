export type StoryEmbedKind = "article" | "video" | "podcast" | "report";

export type StoryOverlaySummary = {
  sources?: Array<{
    id: string;
    name: string;
    url?: string;
  }>;
};

export type StoryClusterView = {
  id: string;
  title: string;
  primaryUrl: string;
  embedKind: StoryEmbedKind;
  overlays?: StoryOverlaySummary;
};

type FetchStoriesParams = {
  limit?: number;
};

const STUB_STORIES: StoryClusterView[] = [
  {
    id: "story-1",
    title: "OpenAI rolls out GPT-Next with memory safeguards",
    primaryUrl: "https://example.com/openai-gpt-next",
    embedKind: "article",
    overlays: {
      sources: [
        { id: "source-1", name: "The Research Post" },
        { id: "source-2", name: "AI Weekly" },
      ],
    },
  },
  {
    id: "story-2",
    title: "Anthropic shares Claude roadmap for enterprise research teams",
    primaryUrl: "https://example.com/anthropic-roadmap",
    embedKind: "report",
    overlays: {
      sources: [
        { id: "source-3", name: "Founders Journal" },
        { id: "source-4", name: "Research Letters" },
      ],
    },
  },
  {
    id: "story-3",
    title: "YouTube channel DeepDive dissects multimodal agents",
    primaryUrl: "https://example.com/deep-dive-video",
    embedKind: "video",
    overlays: {
      sources: [{ id: "source-5", name: "DeepDive" }],
    },
  },
];

export async function fetchStoriesForDashboard(
  params: FetchStoriesParams = {},
): Promise<{ stories: StoryClusterView[] }> {
  const limit = params.limit ?? STUB_STORIES.length;
  return {
    stories: STUB_STORIES.slice(0, limit),
  };
}

export async function fetchStoryForDashboard(storyId: string) {
  const story = STUB_STORIES.find((item) => item.id === storyId);
  if (!story) {
    throw new Error("Story not found");
  }
  return story;
}
