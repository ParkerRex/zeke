import { z } from "@hono/zod-openapi";

export const highlightOriginSchema = z
  .enum(["user", "assistant", "system"])
  .openapi({
    description: "Source of the highlight content",
    example: "assistant",
  });

export const highlightShareScopeSchema = z
  .enum(["private", "team", "public"])
  .openapi({
    description: "Visibility scope for a shared highlight",
    example: "team",
  });

export const highlightCollaboratorRoleSchema = z
  .enum(["viewer", "editor"])
  .openapi({
    description: "Role granted to a highlight collaborator",
    example: "editor",
  });

export const highlightKindSchema = z
  .enum([
    "insight",
    "quote",
    "action",
    "question",
    "code_example",
    "code_change",
    "api_change",
    "metric",
  ])
  .openapi({
    description: "Type of highlight content",
    example: "code_example",
  });

export const createHighlightInputSchema = z
  .object({
    storyId: z.string().uuid().openapi({
      description: "Story to attach the highlight to",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    chapterId: z.string().uuid().optional().openapi({
      description: "Optional chapter association",
      example: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    }),
    kind: highlightKindSchema.default("insight"),
    title: z.string().optional().openapi({
      description: "Optional headline for the highlight",
      example: "Playbook adoption jumps 30%",
    }),
    summary: z.string().min(1).openapi({
      description: "Short summary of the highlight",
      example: "Adoption increased after introducing contextual workflows.",
    }),
    quote: z.string().optional().openapi({
      description: "Supporting quote for the highlight",
      example: "This rollout removed friction for every AE.",
    }),
    tags: z.array(z.string()).optional().openapi({
      description: "Tags to associate",
      example: ["sales", "enablement"],
    }),
    turnIds: z.array(z.string().uuid()).optional().openapi({
      description: "Transcript turns that support the insight",
      example: ["4b6c8d0e-1f23-4567-89ab-cdef01234567"],
    }),
    startSeconds: z.number().min(0).optional().openapi({
      description: "Start timestamp for media clips",
      example: 120,
    }),
    endSeconds: z.number().min(0).optional().openapi({
      description: "End timestamp for media clips",
      example: 140,
    }),
    metadata: z.record(z.unknown()).optional().openapi({
      description: "Additional metadata for downstream tooling",
    }),
    origin: highlightOriginSchema.optional(),
    originMetadata: z.record(z.unknown()).optional().openapi({
      description: "Metadata about the source system",
    }),
  })
  .openapi({
    description: "Payload for creating a new highlight",
  });

export const highlightReferenceSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the reference record",
      example: "59f6cead-63f7-4a35-8b6c-1234567890ab",
    }),
    highlightId: z.string().uuid().openapi({
      description: "Highlight the reference belongs to",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    turnId: z.string().uuid().openapi({
      description: "Transcript turn the reference points at",
      example: "c7d8e9f0-1234-5678-9012-abcdef345678",
    }),
    sourceUrl: z.string().url().nullable().openapi({
      description: "Optional supporting URL",
      example: "https://youtube.com/watch?v=abc123&t=123",
    }),
    storyId: z.string().uuid().openapi({
      description: "Story that contains the reference",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    chapterId: z.string().uuid().nullable().openapi({
      description: "Chapter associated with the reference",
      example: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    }),
    speaker: z.string().nullable().openapi({
      description: "Speaker attribution pulled from transcripts",
      example: "Sam Altman",
    }),
    content: z.string().nullable().openapi({
      description: "Excerpt for the reference",
      example: "GPT-5 will deliver 10x multimodal throughput...",
    }),
    startSeconds: z.number().nullable().openapi({
      description: "Start timestamp (seconds) for media references",
      example: 732,
    }),
    endSeconds: z.number().nullable().openapi({
      description: "End timestamp (seconds)",
      example: 754,
    }),
  })
  .openapi({
    description: "Reference to transcript turns or external resources",
  });

export const highlightCollaboratorSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Collaborator record identifier",
      example: "f1e2d3c4-b5a6-7890-1234-abcdef567890",
    }),
    highlightId: z.string().uuid().openapi({
      description: "Highlight the collaborator can access",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    userId: z.string().uuid().openapi({
      description: "Collaborator user identifier",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    role: highlightCollaboratorRoleSchema,
    createdAt: z.string().nullable().openapi({
      description: "When the collaborator was added",
      example: "2024-05-12T16:45:00Z",
    }),
    updatedAt: z.string().nullable().openapi({
      description: "When the collaborator record last changed",
      example: "2024-05-13T09:01:00Z",
    }),
  })
  .openapi({
    description: "Access control metadata for shared highlights",
  });

export const teamHighlightStateSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "State record identifier",
      example: "0f1e2d3c-4b5a-6789-0123-abcdef456789",
    }),
    highlightId: z.string().uuid().openapi({
      description: "Highlight the state is attached to",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    teamId: z.string().uuid().openapi({
      description: "Owning team",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
    state: z.string().nullable().openapi({
      description: "Team-specific status (active, archived, etc.)",
      example: "active",
    }),
    pinnedBy: z.string().uuid().nullable().openapi({
      description: "User who pinned the highlight",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    sharedScope: highlightShareScopeSchema,
    sharedBy: z.string().uuid().nullable().openapi({
      description: "User who last shared the highlight",
      example: "987e6543-e21b-12d3-a456-426614174111",
    }),
    sharedAt: z.string().nullable().openapi({
      description: "Timestamp the highlight was shared",
      example: "2024-05-15T08:05:00Z",
    }),
    updatedAt: z.string().nullable().openapi({
      description: "When the state was last updated",
      example: "2024-05-16T10:23:00Z",
    }),
  })
  .openapi({
    description: "Per-team state for a highlight",
  });

export const highlightSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Highlight identifier",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    storyId: z.string().uuid().openapi({
      description: "Story the highlight belongs to",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    teamId: z.string().uuid().nullable().openapi({
      description: "Owning team, null when globally shared",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
    createdBy: z.string().uuid().openapi({
      description: "User who created the highlight",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    chapterId: z.string().uuid().nullable().openapi({
      description: "Associated chapter",
      example: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    }),
    kind: highlightKindSchema.openapi({
      description: "Categorization for the highlight",
      example: "insight",
    }),
    origin: highlightOriginSchema,
    title: z.string().nullable().openapi({
      description: "Headline for the highlight",
      example: "Novel claim: GPT-5 trains at 10x scale",
    }),
    summary: z.string().nullable().openapi({
      description: "AI-generated summary",
      example: "GPT-5 training increases compute by 10x compared to GPT-4",
    }),
    quote: z.string().nullable().openapi({
      description: "Quoted transcript content",
      example: "We had to redesign the multimodal stack...",
    }),
    startSeconds: z.number().nullable().openapi({
      description: "Media start timestamp (seconds)",
      example: 732,
    }),
    endSeconds: z.number().nullable().openapi({
      description: "Media end timestamp (seconds)",
      example: 754,
    }),
    confidence: z.number().nullable().openapi({
      description: "Model confidence score",
      example: 0.91,
    }),
    isGenerated: z.boolean().openapi({
      description: "Whether the highlight was AI generated",
      example: true,
    }),
    metadata: z.record(z.unknown()).nullable().openapi({
      description: "Additional AI metadata",
    }),
    originMetadata: z.record(z.unknown()).nullable().openapi({
      description: "Metadata from the originating system",
    }),
    createdAt: z.string().nullable().openapi({
      description: "Creation timestamp",
      example: "2024-05-12T16:45:00Z",
    }),
    updatedAt: z.string().nullable().openapi({
      description: "Last update timestamp",
      example: "2024-05-16T10:23:00Z",
    }),
    tags: z.array(z.string()).openapi({
      description: "Associated tag slugs",
      example: ["novel-claim", "key-insight"],
    }),
    references: z.array(highlightReferenceSchema).openapi({
      description: "Transcript references backing the highlight",
    }),
    collaborators: z.array(highlightCollaboratorSchema).openapi({
      description: "Collaboration metadata for the highlight",
    }),
    state: teamHighlightStateSchema.nullable(),
  })
  .openapi({
    description: "Full highlight payload including references and team state",
  });

export const highlightListResponseSchema = z.array(highlightSchema).openapi({
  description: "Highlights returned for a story or query",
});

export const highlightFeedSortSchema = z
  .enum(["recent", "relevant", "confidence"])
  .openapi({
    description: "Sorting strategy for highlight feeds",
    example: "recent",
  });

export const highlightFeedInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(20).openapi({
      description: "Maximum highlights to return",
      example: 20,
    }),
    offset: z.number().int().min(0).default(0).openapi({
      description: "Number of highlights to skip",
      example: 0,
    }),
    goalIds: z.array(z.string()).optional().openapi({
      description: "Goals to prioritize in the feed",
      example: ["improve-onboarding"],
    }),
    tags: z.array(z.string()).optional().openapi({
      description: "Tag filters to apply",
      example: ["key-insight", "novel-claim"],
    }),
    kind: z.union([highlightKindSchema, z.literal("all")]).default("all").openapi({
      description: "Highlight kind filter, or 'all' for any",
      example: "insight",
    }),
    sortBy: highlightFeedSortSchema.default("recent"),
    scope: z
      .enum(["all", "system", "team"])
      .default("all")
      .openapi({
        description:
          "Which highlights to return: system-generated, team-created, or both",
        example: "system",
      }),
  })
  .openapi({
    description: "Parameters for fetching paginated highlight feeds",
  });

export const highlightFeedResponseSchema = z
  .object({
    items: z.array(z.lazy(() => highlightSchema)),
    pagination: z
      .object({
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
        hasMore: z.boolean(),
      })
      .openapi({
        description: "Pagination metadata for the feed",
      }),
    filters: z
      .object({
        kind: highlightKindSchema.nullable(),
        tags: z.array(z.string()),
        goalIds: z.array(z.string()),
        sortBy: highlightFeedSortSchema,
        scope: z.enum(["all", "system", "team"]),
      })
      .openapi({
        description: "Filters applied to the feed results",
      }),
  })
  .openapi({
    description: "Highlight feed with pagination and applied filters",
  });

export const highlightTrendingInputSchema = z
  .object({
    limit: z.number().int().min(1).max(20).default(10).openapi({
      description: "Maximum highlights to return",
      example: 10,
    }),
    timeframe: z.enum(["day", "week", "month"]).default("week").openapi({
      description: "Timeframe window to consider",
      example: "week",
    }),
    scope: z
      .enum(["system", "team", "all"])
      .default("system")
      .openapi({
        description:
          "Which highlights to consider when evaluating trending results",
        example: "system",
      }),
  })
  .openapi({
    description: "Parameters for fetching trending highlights",
  });

export const highlightTrendingResponseSchema = z
  .object({
    items: z.array(z.lazy(() => highlightSchema)),
    timeframe: z.enum(["day", "week", "month"]),
    generatedAt: z.string().openapi({
      description: "Timestamp when the payload was generated",
      example: "2024-05-16T10:23:00Z",
    }),
  })
  .openapi({
    description: "Trending highlights snapshot",
  });

export const highlightEngagementSchema = z
  .object({
    highlightId: z.string().uuid().openapi({
      description: "Highlight the engagement metrics refer to",
      example: "2a4b6c8d-0e1f-2345-6789-abcdef012345",
    }),
    teamId: z.string().uuid().openapi({
      description: "Team the engagement metrics are scoped to",
      example: "1a2b3c4d-5e6f-7081-92a3-b4c5d6e7f809",
    }),
    activeCount: z.number().int().openapi({
      description: "Active highlight instances",
      example: 12,
    }),
    archivedCount: z.number().int().openapi({
      description: "Archived instances",
      example: 3,
    }),
    pinnedCount: z.number().int().openapi({
      description: "How many teammates pinned the highlight",
      example: 4,
    }),
    linkedPlaybookSteps: z.number().int().openapi({
      description: "Playbook steps referencing the highlight",
      example: 2,
    }),
    linkedThreads: z.number().int().openapi({
      description: "Assistant threads referencing the highlight",
      example: 1,
    }),
    lastUpdatedAt: z.string().nullable().openapi({
      description: "Most recent engagement update timestamp",
      example: "2024-05-16T10:23:00Z",
    }),
  })
  .openapi({
    description: "Aggregated engagement metrics for highlights",
  });

export const highlightsByStoryInputSchema = z
  .object({
    storyId: z.string().uuid().openapi({
      description: "Story to fetch highlights for",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    includeGlobal: z
      .boolean()
      .default(true)
      .openapi({
        description:
          "Deprecated: use scope to control whether team or system highlights are returned",
        example: true,
      }),
    scope: z
      .enum(["all", "system", "team"])
      .default("all")
      .openapi({
        description:
          "Highlight scope to return for a story: system-generated, team-created, or both",
        example: "all",
      }),
  })
  .openapi({
    description: "Parameters for fetching highlights tied to a story",
  });

export const highlightIdsInputSchema = z
  .object({
    highlightIds: z
      .array(z.string().uuid())
      .min(1)
      .openapi({
        description: "Highlight identifiers to fetch engagement for",
        example: [
          "2a4b6c8d-0e1f-2345-6789-abcdef012345",
          "4b6c8d0e-1f23-4567-89ab-cdef01234567",
        ],
      }),
  })
  .openapi({
    description: "Input payload for highlight engagement queries",
  });

export const prioritizedHighlightSchema = z
  .object({
    id: z.string().uuid(),
    storyId: z.string().uuid(),
    kind: z.string().nullable(),
    title: z.string().nullable(),
    summary: z.string().nullable(),
    quote: z.string().nullable(),
    confidence: z.string().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: z.string().nullable(),
    storyTitle: z.string().nullable(),
    storyPublishedAt: z.string().nullable(),
  })
  .openapi({
    description: "Lightweight highlight with story context for dashboard",
  });

export const prioritizedHighlightsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20).openapi({
      description: "Maximum number of highlights to return",
      example: 20,
    }),
  })
  .openapi({
    description: "Parameters for fetching prioritized highlights",
  });

export const highlightsByKindInputSchema = z
  .object({
    kind: highlightKindSchema,
    minRelevance: z.number().min(0).max(1).default(0.7).openapi({
      description: "Minimum relevance score threshold",
      example: 0.7,
    }),
    limit: z.number().int().min(1).max(50).default(10).openapi({
      description: "Maximum number of highlights to return",
      example: 10,
    }),
  })
  .openapi({
    description: "Parameters for fetching highlights by kind with relevance filtering",
  });

export type Highlight = z.infer<typeof highlightSchema>;
export type HighlightEngagement = z.infer<typeof highlightEngagementSchema>;
export type HighlightsByStoryInput = z.infer<
  typeof highlightsByStoryInputSchema
>;
export type HighlightIdsInput = z.infer<typeof highlightIdsInputSchema>;
export type PrioritizedHighlight = z.infer<typeof prioritizedHighlightSchema>;
export type PrioritizedHighlightsInput = z.infer<
  typeof prioritizedHighlightsInputSchema
>;
export type HighlightsByKindInput = z.infer<typeof highlightsByKindInputSchema>;
export type HighlightFeedInput = z.infer<typeof highlightFeedInputSchema>;
export type HighlightFeedResponse = z.infer<typeof highlightFeedResponseSchema>;
export type HighlightTrendingInput = z.infer<typeof highlightTrendingInputSchema>;
export type HighlightTrendingResponse = z.infer<
  typeof highlightTrendingResponseSchema
>;
export type CreateHighlightInput = z.infer<typeof createHighlightInputSchema>;
