import { z } from "zod";

export const getHighlightsSchema = z.object({
  timeframe: z.enum(["day", "week", "month", "all"]).default("week"),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(10),
  refresh: z.boolean().default(false).optional(),
  storyId: z.string().uuid().optional(),
});

export const getSummariesSchema = z.object({
  sourceIds: z.array(z.string()).optional(),
  topic: z.string().optional(),
  maxSources: z.number().min(1).max(20).default(5),
  style: z.enum(["brief", "detailed", "executive"]).default("brief"),
});

export const getBriefSchema = z.object({
  topic: z.string(),
  audience: z.enum(["technical", "executive", "general"]).default("general"),
  format: z.enum(["brief", "report", "presentation", "blog"]).default("brief"),
  includeRecommendations: z.boolean().default(true),
});

export const getPlaybookSchema = z.object({
  objective: z.string(),
  scope: z.enum(["narrow", "moderate", "comprehensive"]).default("moderate"),
  timeline: z.enum(["daily", "weekly", "monthly"]).optional(),
  automationLevel: z
    .enum(["manual", "semi-auto", "full-auto"])
    .default("semi-auto"),
});

export const linkInsightsSchema = z.object({
  insightIds: z.array(z.string()).optional(),
  goalIds: z.array(z.string()).optional(),
  lookForPatterns: z.boolean().default(true),
  minConfidence: z.number().min(0).max(1).default(0.7),
});

export const toolSchemas = {
  getHighlights: getHighlightsSchema,
  getSummaries: getSummariesSchema,
  getBrief: getBriefSchema,
  getPlaybook: getPlaybookSchema,
  linkInsights: linkInsightsSchema,
} as const;

export type ToolSchemaMap = typeof toolSchemas;

export type GetHighlightsInput = z.infer<typeof getHighlightsSchema>;
export type GetSummariesInput = z.infer<typeof getSummariesSchema>;
export type GetBriefInput = z.infer<typeof getBriefSchema>;
export type GetPlaybookInput = z.infer<typeof getPlaybookSchema>;
export type LinkInsightsInput = z.infer<typeof linkInsightsSchema>;
