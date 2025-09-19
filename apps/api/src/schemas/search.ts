import { z } from "@hono/zod-openapi";

export const searchResultSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Identifier of the matched entity",
      example: "9f3a4c3f-6f5a-4d2e-97cf-0b3e20a1f4f2",
    }),
    type: z.string().openapi({
      description: "Entity type returned by search (e.g. story, highlight)",
      example: "story",
    }),
    title: z.string().openapi({
      description: "Primary label for the result",
      example: "OpenAI GPT-5 Training Leaked",
    }),
    relevance: z.number().openapi({
      description: "Relevance score returned by the search routine",
      example: 0.87,
    }),
    created_at: z.string().openapi({
      description: "Creation timestamp for the underlying entity",
      example: "2024-05-12T15:30:00Z",
    }),
    data: z.record(z.unknown()).openapi({
      description: "Raw payload returned by the search procedure",
    }),
  })
  .openapi({
    description: "Generic search hit",
  });

export const globalSearchInputSchema = z
  .object({
    searchTerm: z
      .string()
      .min(1)
      .max(120)
      .openapi({
        description: "Full text query",
        example: "GPT-5",
      }),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .openapi({
        description: "Maximum number of results",
        example: 20,
      }),
    itemsPerTableLimit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .openapi({
        description: "Per-entity cap when querying multiple tables",
        example: 5,
      }),
    language: z
      .string()
      .optional()
      .openapi({
        description: "Language hint for full-text search",
        example: "english",
      }),
    relevanceThreshold: z
      .number()
      .optional()
      .openapi({
        description: "Minimum relevance to include a result",
        example: 0.5,
      }),
  })
  .openapi({
    description: "Parameters for the global search procedure",
  });

export const semanticSearchInputSchema = z
  .object({
    searchTerm: z.string().min(1).max(256).openapi({
      description: "Natural language query",
      example: "Recent AI regulation news",
    }),
    itemsPerTableLimit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5)
      .openapi({
        description: "Max results per table",
        example: 5,
      }),
    language: z.string().optional().openapi({
      description: "Language hint for embedding lookup",
      example: "english",
    }),
    types: z
      .array(z.string())
      .optional()
      .openapi({
        description: "Entity types to limit the search",
        example: ["stories", "highlights"],
      }),
    amount: z.number().optional().openapi({
      description: "Exact amount filter for financial entities",
      example: 1200,
    }),
    amountMin: z.number().optional().openapi({
      description: "Minimum amount filter",
      example: 100,
    }),
    amountMax: z.number().optional().openapi({
      description: "Maximum amount filter",
      example: 5000,
    }),
    status: z.string().optional().openapi({
      description: "Status filter (e.g. invoice status)",
      example: "pending",
    }),
    currency: z.string().optional().openapi({
      description: "Currency code filter",
      example: "USD",
    }),
    startDate: z.string().optional().openapi({
      description: "Filter by start date (ISO string)",
      example: "2024-05-01",
    }),
    endDate: z.string().optional().openapi({
      description: "Filter by end date (ISO string)",
      example: "2024-05-31",
    }),
    dueDateStart: z.string().optional().openapi({
      description: "Invoice due date lower bound",
      example: "2024-05-15",
    }),
    dueDateEnd: z.string().optional().openapi({
      description: "Invoice due date upper bound",
      example: "2024-05-31",
    }),
  })
  .openapi({
    description: "Parameters for semantic search",
  });

export type SearchResult = z.infer<typeof searchResultSchema>;
export type GlobalSearchInput = z.infer<typeof globalSearchInputSchema>;
