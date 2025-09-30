import { z } from "zod";

/**
 * Research tool metadata for the assistant
 * These tools replace finance tools with research-focused capabilities
 */
export const researchToolMetadata = {
  getStoryHighlights: {
    name: "getStoryHighlights",
    title: "Story Highlights",
    description:
      "Retrieve and analyze story highlights, key insights, and trending topics from ingested content",
    parameters: z.object({
      timeframe: z.enum(["day", "week", "month", "all"]).optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().min(1).max(50).default(10),
    }),
    relatedTools: ["summarizeSources", "linkInsights"],
  },

  summarizeSources: {
    name: "summarizeSources",
    title: "Summarize Sources",
    description:
      "Generate comprehensive summaries from multiple sources with key takeaways and insights",
    parameters: z.object({
      sourceIds: z.array(z.string()).optional(),
      topic: z.string().optional(),
      maxSources: z.number().min(1).max(20).default(5),
      style: z.enum(["brief", "detailed", "executive"]).default("brief"),
    }),
    relatedTools: ["getStoryHighlights", "draftBrief"],
  },

  draftBrief: {
    name: "draftBrief",
    title: "Draft Brief",
    description:
      "Create a research brief or content outline based on collected insights and stories",
    parameters: z.object({
      topic: z.string(),
      audience: z
        .enum(["technical", "executive", "general"])
        .default("general"),
      format: z
        .enum(["brief", "report", "presentation", "blog"])
        .default("brief"),
      includeRecommendations: z.boolean().default(true),
    }),
    relatedTools: ["summarizeSources", "planPlaybook"],
  },

  planPlaybook: {
    name: "planPlaybook",
    title: "Plan Playbook",
    description:
      "Design and plan a research playbook for systematic analysis of a topic or competitor",
    parameters: z.object({
      objective: z.string(),
      scope: z
        .enum(["narrow", "moderate", "comprehensive"])
        .default("moderate"),
      timeline: z.enum(["daily", "weekly", "monthly"]).optional(),
      automationLevel: z
        .enum(["manual", "semi-auto", "full-auto"])
        .default("semi-auto"),
    }),
    relatedTools: ["draftBrief", "linkInsights"],
  },

  linkInsights: {
    name: "linkInsights",
    title: "Link Insights",
    description:
      "Connect and correlate insights across stories, highlights, and goals to identify patterns",
    parameters: z.object({
      insightIds: z.array(z.string()).optional(),
      goalIds: z.array(z.string()).optional(),
      lookForPatterns: z.boolean().default(true),
      minConfidence: z.number().min(0).max(1).default(0.7),
    }),
    relatedTools: ["getStoryHighlights", "planPlaybook"],
  },

  webSearch: {
    name: "webSearch",
    title: "Web Search",
    description:
      "Search the web for current information, news, and research materials",
    parameters: z.object({
      query: z.string(),
      recency: z.enum(["hour", "day", "week", "month", "year"]).optional(),
      domain: z.string().optional(),
      maxResults: z.number().min(1).max(10).default(5),
    }),
    relatedTools: ["summarizeSources", "getStoryHighlights"],
  },
} as const;

export type ResearchToolName = keyof typeof researchToolMetadata;

export type ToolResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    toolName: ResearchToolName;
    executionTime: number;
    cacheHit?: boolean;
  };
};

export type MessageDataParts = {
  title: {
    title: string;
  };
  artifact?: {
    type: "brief" | "report" | "playbook" | "summary";
    content: any;
  };
};
