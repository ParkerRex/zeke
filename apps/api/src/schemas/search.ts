import { z } from "@hono/zod-openapi";

export const globalSearchSchema = z
  .object({
    searchTerm: z.string().optional().openapi({
      description: "Research query to discover insights across ingested knowledge sources.",
      example: "market expansion strategy",
    }),
    language: z.string().optional().openapi({
      description: "Language for contextual understanding and cited output generation.",
      example: "en",
    }),
    limit: z.coerce.number().min(1).max(1000).default(30).openapi({
      description: "Maximum insights to surface for triage and goal alignment.",
      example: 30,
    }),
    itemsPerTableLimit: z.coerce.number().min(1).max(100).default(5).openapi({
      description: "Discovery depth per entity type for comprehensive research coverage.",
      example: 5,
    }),
    relevanceThreshold: z.coerce.number().min(0).max(1).default(0.01).openapi({
      description: "Minimum confidence score for insight inclusion in research outcomes.",
      example: 0.01,
    }),
  })
  .openapi({
    description:
      "Discovery parameters for transforming hours of research into cited, goal-aware insights.",
  });

export const searchResponseSchema = z
  .array(
    z.object({
      id: z.string().openapi({
        description: "Citation reference for tracking insight provenance in published outputs.",
        example: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
      }),
      type: z.string().openapi({
        description:
          "Entity classification for triage workflows (story, playbook, transaction, etc).",
        example: "story",
      }),
      relevance: z.number().openapi({
        description: "Goal-alignment score for prioritizing insights during triage.",
        example: 0.92,
      }),
      created_at: z.string().openapi({
        description: "Temporal context for research freshness and trend analysis.",
        example: "2024-06-01T00:00:00.000Z",
      }),
      data: z.any().openapi({
        description:
          "Discovered insight payload ready for application in playbooks and outcomes.",
        example: {
          storyId: "STR-2024-001",
          entityName: "Acme Research Lab",
          impact: 1500.75,
          citations: ["source1", "source2"],
        },
      }),
    }),
  )
  .openapi({
    description: "Discovered insights triaged for goal-aware application and publishing.",
    example: [
      {
        id: "b3b7e6e2-8c2a-4e2a-9b1a-2e4b5c6d7f8a",
        type: "story",
        relevance: 0.92,
        created_at: "2024-06-01T00:00:00.000Z",
        data: {
          storyId: "STR-2024-001",
          entityName: "Acme Research Lab",
          impact: 1500.75,
          citations: ["quarterly-report.pdf", "market-analysis.xlsx"],
        },
      },
    ],
  });
