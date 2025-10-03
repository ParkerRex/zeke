export type ToolExecutionMetadata<TName extends string = string> = {
  toolName: TName;
  executionTime: number;
  cacheHit?: boolean;
};

export type ToolResult<TData = unknown, TName extends string = string> = {
  success: boolean;
  data?: TData;
  error?: string;
  metadata?: ToolExecutionMetadata<TName>;
};

export type HighlightMetrics = {
  confidence: number | null;
  timeSavedSeconds: number | null;
};

export type HighlightDetail = {
  id: string;
  title: string;
  summary: string | null;
  quote: string | null;
  kind: string | null;
  confidence: number | null;
  story: {
    id: string;
    title: string | null;
    sourceName: string | null;
    publishedAt: string | null;
  };
  tags: string[];
  createdAt: string | null;
  metrics: HighlightMetrics;
};

export type HighlightToolData = {
  highlights: HighlightDetail[];
  stats: {
    total: number;
    byKind: Record<string, number>;
    averageConfidence: number;
    topTags: Array<{ tag: string; count: number }>;
  };
  timeframe: string;
  filters: {
    tags: string[];
    storyId?: string;
  };
};

export type SummaryToolData = {
  summary: {
    mainThemes: string[];
    keyInsights: Array<{
      insight: string;
      confidence: number;
      sources: string[];
    }>;
    consensus?: string;
    conflicts?: string[];
    recommendations?: string[];
  };
  sources: Array<{
    id: string | null;
    name: string | null;
    storyCount: number;
  }>;
  metadata: {
    totalSources: number;
    totalStories: number;
    totalHighlights: number;
    style: string;
    topic?: string;
  };
};

export type MessageDataParts = {
  title: {
    title: string;
  };
  artifact?: {
    type: "brief" | "report" | "playbook" | "summary";
    content: unknown;
  };
};
