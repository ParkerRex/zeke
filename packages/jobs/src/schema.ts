import { z } from "zod";

export const ingestPullSchema = z.object({
  sourceType: z.literal("rss").default("rss"),
  reason: z.enum(["schedule", "manual"]).default("schedule"),
});

export type IngestPullPayload = z.infer<typeof ingestPullSchema>;

export const ingestSourceSchema = z.object({
  sourceId: z.string().uuid("sourceId must be a UUID"),
  reason: z.enum(["schedule", "manual", "retry"]).default("schedule"),
  cursor: z.string().optional(),
});

export type IngestSourcePayload = z.infer<typeof ingestSourceSchema>;

export const fetchContentSchema = z.object({
  rawItemIds: z
    .array(z.string().uuid("rawItemIds entries must be UUIDs"))
    .min(1),
});

export type FetchContentPayload = z.infer<typeof fetchContentSchema>;

export const analyzeStorySchema = z.object({
  storyId: z.string().uuid("storyId must be a UUID"),
  trigger: z.enum(["auto", "manual", "retry"]).default("auto"),
});

export type AnalyzeStoryPayload = z.infer<typeof analyzeStorySchema>;

export const oneOffIngestSchema = z.object({
  url: z.string().url(),
  requestedBy: z.string().uuid().optional(),
  priority: z.enum(["normal", "high"]).default("normal"),
});

export type OneOffIngestPayload = z.infer<typeof oneOffIngestSchema>;

export const ingestUploadSchema = z.object({
  sourceId: z.string().uuid("sourceId must be a UUID"),
  items: z
    .array(
      z.object({
        externalId: z.string().min(1),
        url: z.string().url().optional(),
        title: z.string().optional().nullable(),
        text: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .min(1),
  uploadedBy: z.string().uuid().optional(),
});

export type IngestUploadPayload = z.infer<typeof ingestUploadSchema>;

export const linkSourceToStorySchema = z.object({
  sourceId: z.string().uuid("sourceId must be a UUID"),
  storyId: z.string().uuid("storyId must be a UUID"),
});

export type LinkSourceToStoryPayload = z.infer<typeof linkSourceToStorySchema>;

const insightBaseSchema = z.object({
  title: z.string().optional().nullable(),
  summary: z.string().min(1, "summary is required"),
  quote: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  origin: z.enum(["system", "assistant"]).default("system"),
});

export const dedupeInsightsSchema = z.object({
  storyId: z.string().uuid("storyId must be a UUID"),
  teamId: z.string().uuid().optional(),
  createdBy: z.string().uuid("createdBy must be a UUID"),
  insights: z.array(insightBaseSchema).min(1, "insights must not be empty"),
});

export type DedupeInsightsPayload = z.infer<typeof dedupeInsightsSchema>;

export const attachInsightSchema = z.object({
  storyId: z.string().uuid("storyId must be a UUID"),
  teamId: z.string().uuid("teamId must be a UUID"),
  createdBy: z.string().uuid("createdBy must be a UUID"),
  insight: insightBaseSchema,
});

export type AttachInsightPayload = z.infer<typeof attachInsightSchema>;

export const summarizeStorySchema = z.object({
  storyId: z.string().uuid("storyId must be a UUID"),
  mode: z.enum(["auto", "force"]).default("auto"),
});

export type SummarizeStoryPayload = z.infer<typeof summarizeStorySchema>;

export const updateStoryStatusSchema = z.object({
  storyId: z.string().uuid("storyId must be a UUID"),
  teamId: z.string().uuid().optional(),
  state: z.enum(["unread", "read", "archived"]).default("unread"),
});

export type UpdateStoryStatusPayload = z.infer<typeof updateStoryStatusSchema>;

export const runPlaybookSchema = z.object({
  playbookId: z.string().uuid("playbookId must be a UUID"),
  teamId: z.string().uuid("teamId must be a UUID"),
  triggeredBy: z.string().uuid("triggeredBy must be a UUID").optional(),
  triggerSource: z
    .enum(["dashboard", "api", "schedule", "system"])
    .default("dashboard"),
  metadata: z.record(z.any()).optional(),
});

export type RunPlaybookPayload = z.infer<typeof runPlaybookSchema>;
