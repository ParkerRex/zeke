import { z } from "@hono/zod-openapi";

export const storyEmbedKindSchema = z
  .enum(["article", "youtube", "podcast", "arxiv", "twitter", "video", "pdf"])
  .openapi({
    description: "Enum describing how the story should be rendered in the UI",
    example: "youtube",
  });

export const storySourceSchema = z
  .object({
    title: z.string().openapi({
      description: "Human-friendly source label",
      example: "OpenAI Blog",
    }),
    url: z.string().url().openapi({
      description: "Direct URL to the supporting source",
      example: "https://openai.com/blog/example",
    }),
    domain: z.string().openapi({
      description: "Domain extracted from the source URL",
      example: "openai.com",
    }),
  })
  .openapi({
    description: "Reference material backing an overlay insight",
  });

export const storyOverlaySchema = z
  .object({
    whyItMatters: z.string().nullable().openapi({
      description: "AI-generated executive summary for the story",
      example: "Highlights the strategic impact of GPT-5 training leaks.",
    }),
    chili: z.number().int().min(0).max(5).openapi({
      description: "Normalized alert level for the story (0-5)",
      example: 4,
    }),
    confidence: z.number().nullable().openapi({
      description: "Model confidence score for the overlay",
      example: 0.82,
    }),
    sources: z.array(storySourceSchema).openapi({
      description: "Supporting citations used to generate the overlay",
    }),
  })
  .openapi({
    description: "Summarized overlay metadata for a story",
  });

export const storyListItemSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique story identifier",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    clusterId: z.string().uuid().nullable().openapi({
      description: "Parent cluster identifier, if grouped",
      example: "7a1c2d3e-4f5b-6789-1234-abcdef987654",
    }),
    title: z.string().nullable().openapi({
      description: "Primary headline for the story",
      example: "OpenAI GPT-5 Training Leaked",
    }),
    summary: z.string().nullable().openapi({
      description: "Short synopsis used in list views",
      example: "Leak suggests GPT-5 pushes 10x compute and real-time features.",
    }),
    primaryUrl: z.string().url().nullable().openapi({
      description: "Canonical URL for the story",
      example: "https://news.example.com/openai-gpt5-leak",
    }),
    embedKind: storyEmbedKindSchema,
    embedUrl: z.string().url().nullable().openapi({
      description: "URL used by the player/embed component",
      example: "https://youtube.com/watch?v=abc123",
    }),
    overlays: storyOverlaySchema,
    publishedAt: z.string().nullable().openapi({
      description: "Original publication timestamp (ISO 8601)",
      example: "2024-05-12T15:30:00Z",
    }),
    createdAt: z.string().openapi({
      description: "When the story entered the Zeke system (ISO 8601)",
      example: "2024-05-12T16:00:00Z",
    }),
  })
  .openapi({
    description: "Story record ready for display in list or detail views",
  });

export const storyClusterSummarySchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the cluster",
      example: "3d2c1b0a-9876-5432-10fe-dcba98765432",
    }),
    clusterKey: z.string().openapi({
      description: "Canonical key derived from the cluster grouping logic",
      example: "openai-gpt5-training",
    }),
    label: z.string().nullable().openapi({
      description: "Default label/title for the cluster",
      example: "GPT-5 Roadmap",
    }),
    primaryStoryId: z.string().uuid().nullable().openapi({
      description: "Story acting as the cluster anchor",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
  })
  .openapi({
    description: "Summary metadata for a story cluster",
  });

export const storyClusterSchema = storyClusterSummarySchema
  .extend({
    stories: z.array(storyListItemSchema).openapi({
      description: "All stories associated with the cluster",
    }),
  })
  .openapi({
    description: "Story cluster with nested story views",
  });

export const storyMetricsSchema = z
  .object({
    storyId: z.string().uuid().openapi({
      description: "Story identifier the metrics belong to",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    teamId: z.string().uuid().openapi({
      description: "Team the metrics are scoped to",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
    readCount: z.number().int().openapi({
      description: "How many teammates marked the story as read",
      example: 12,
    }),
    unreadCount: z.number().int().openapi({
      description: "Teammates with the story still unread",
      example: 6,
    }),
    archivedCount: z.number().int().openapi({
      description: "Archived/hidden count",
      example: 2,
    }),
    pinnedCount: z.number().int().openapi({
      description: "Pinned instances across the team",
      example: 3,
    }),
    averageRating: z.number().nullable().openapi({
      description: "Average rating, if teammates scored the story",
      example: 4.3,
    }),
    lastViewedAt: z.string().nullable().openapi({
      description: "Most recent view timestamp",
      example: "2024-05-13T09:12:00Z",
    }),
  })
  .openapi({
    description: "Engagement metrics for a story scoped to a team",
  });

export const listStoriesResponseSchema = z
  .object({
    stories: z.array(storyListItemSchema).openapi({
      description: "Stories ready for the dashboard feed",
    }),
    totalCount: z.number().int().openapi({
      description: "Total stories matching the query",
      example: 120,
    }),
    hasMore: z.boolean().openapi({
      description: "Whether additional pages exist",
      example: true,
    }),
  })
  .openapi({
    description: "Paginated story list response",
  });

export const storyDetailSchema = z
  .object({
    story: storyListItemSchema,
    cluster: storyClusterSchema,
    metrics: storyMetricsSchema.nullable(),
  })
  .openapi({
    description: "Detailed payload for a single story view",
  });

export const listStoriesInputSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(20).openapi({
      description: "Max number of stories to fetch",
      example: 20,
    }),
    offset: z.coerce.number().int().min(0).default(0).openapi({
      description: "Offset for pagination",
      example: 40,
    }),
    kind: z
      .enum(["all", "article", "video", "podcast", "pdf", "tweet"], {
        description: "Filter stories by underlying content kind",
      })
      .default("all")
      .openapi({
        example: "article",
      }),
    search: z.string().trim().min(1).max(120).optional().openapi({
      description: "Full-text search term",
      example: "GPT-5",
    }),
    storyIds: z
      .array(z.string().uuid())
      .nonempty()
      .optional()
      .openapi({
        description: "Explicit story IDs to include",
        example: [
          "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
          "2b3c4d5e-6f70-8192-a3b4-c5d6e7f8091a",
        ],
      }),
  })
  .openapi({
    description: "Parameters accepted by the story list endpoint",
  });

export const storyIdInputSchema = z
  .object({
    storyId: z.string().uuid().openapi({
      description: "Story identifier to retrieve",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
  })
  .openapi({
    description: "Identifier-based lookup payload",
  });

export const storyMetricsInputSchema = z
  .object({
    storyIds: z
      .array(z.string().uuid())
      .min(1)
      .openapi({
        description: "Story identifiers to aggregate metrics for",
        example: [
          "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
          "2b3c4d5e-6f70-8192-a3b4-c5d6e7f8091a",
        ],
      }),
  })
  .openapi({
    description: "Parameters accepted by the story metrics endpoint",
  });

export type StoryListItem = z.infer<typeof storyListItemSchema>;
export type StoryCluster = z.infer<typeof storyClusterSchema>;
export type StoryMetrics = z.infer<typeof storyMetricsSchema>;
export type StoryDetail = z.infer<typeof storyDetailSchema>;
export type ListStoriesInput = z.infer<typeof listStoriesInputSchema>;
export type StoryMetricsInput = z.infer<typeof storyMetricsInputSchema>;
