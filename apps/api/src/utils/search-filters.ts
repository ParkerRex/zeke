import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const schema = z.object({
  searchTerm: z.string().describe("The query to search for"),
  startDate: z
    .string()
    .optional()
    .describe(
      "The start date when to retrieve content from. Return ISO-8601 format.",
    ),
  endDate: z
    .string()
    .optional()
    .describe(
      "The end date when to retrieve content from. If not provided, defaults to the current date. Return ISO-8601 format.",
    ),
  types: z
    .array(z.enum(["stories", "sources", "insights", "playbooks", "raw_items"]))
    .describe("The type of content to search for"),
  sourceType: z
    .enum(["youtube", "arxiv", "rss", "twitter", "blog", "podcast", "paper"])
    .optional()
    .describe(
      "The type of content source (e.g., 'youtube', 'arxiv', 'rss', 'twitter').",
    ),
  contentType: z
    .enum(["video", "audio", "text", "paper", "article", "post"])
    .optional()
    .describe(
      "The format of the content (e.g., 'video', 'audio', 'text', 'paper').",
    ),
  analysisStatus: z
    .enum(["pending", "analyzed", "draft", "published"])
    .optional()
    .describe(
      "The analysis status filter (e.g., 'pending', 'analyzed', 'draft', 'published') for stories and insights.",
    ),
  priority: z
    .enum(["low", "medium", "high", "critical"])
    .optional()
    .describe("Priority level filter for insights and playbooks."),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags to filter by (e.g., ['ai', 'research', 'productivity'])."),
  language: z
    .string()
    .describe(
      "The language to search in based on the query. Return in PostgreSQL text search configuration name (e.g., 'english', 'swedish', 'german', 'french').",
    ),
  durationMin: z
    .number()
    .optional()
    .describe("Minimum duration filter for video/audio content (in minutes)."),
  durationMax: z
    .number()
    .optional()
    .describe("Maximum duration filter for video/audio content (in minutes)."),
  publishedStart: z
    .string()
    .optional()
    .describe("Start date for original content publication dates (ISO-8601)."),
  publishedEnd: z
    .string()
    .optional()
    .describe("End date for original content publication dates (ISO-8601)."),
});

export async function generateLLMFilters(
  query: string,
): Promise<z.infer<typeof schema>> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: `You are an AI assistant that converts natural language search queries into structured search filters for a research content management system.

Current date: ${new Date().toISOString().split("T")[0]}

GUIDELINES:
- Extract search terms, date ranges, content types, and other filters from the query
- When dates are mentioned but incomplete (like "March" or "last year"), infer reasonable date ranges
- Choose appropriate types based on the query context:
  * "stories" for analyzed content pieces with insights and highlights
  * "sources" for content providers/channels (YouTube channels, RSS feeds, authors)
  * "insights" for extracted key findings and analysis results
  * "playbooks" for actionable step-by-step guides generated from content
  * "raw_items" for unprocessed content items before analysis

- Map content sources appropriately:
  * "youtube" for YouTube videos and channels
  * "arxiv" for academic papers and preprints
  * "rss" for blog feeds and news sources
  * "twitter" for social media posts and threads
  * "podcast" for audio content
  * "paper" for research papers and academic content

EXAMPLES:
- "show me AI research from last month" → {types: ["stories"], searchTerm: "AI research", startDate: "2024-11-01", endDate: "2024-11-30", language: "english"}
- "YouTube videos about productivity" → {types: ["stories"], searchTerm: "productivity", sourceType: "youtube", contentType: "video", language: "english"}
- "unanalyzed content from this week" → {types: ["raw_items"], analysisStatus: "pending", startDate: "2024-12-22", endDate: "2024-12-28", language: "english"}
- "high priority insights about machine learning" → {types: ["insights"], searchTerm: "machine learning", priority: "high", language: "english"}
- "published playbooks for startup growth" → {types: ["playbooks"], searchTerm: "startup growth", analysisStatus: "published", language: "english"}
- "arxiv papers on AI safety from 2024" → {types: ["stories"], searchTerm: "AI safety", sourceType: "arxiv", contentType: "paper", startDate: "2024-01-01", endDate: "2024-12-31", language: "english"}
- "short videos under 10 minutes about coding" → {types: ["stories"], searchTerm: "coding", contentType: "video", durationMax: 10, language: "english"}

For language, detect the appropriate language of the query for PostgreSQL text search.
`,
    schema,
    prompt: query,
  });

  return object;
}
