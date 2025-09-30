import { describe, it, expect, beforeEach, vi, mock } from "bun:test";
import { getStoryHighlights } from "./get-story-highlights";
import { summarizeSources } from "./summarize-sources";
import { draftBrief } from "./draft-brief";
import { webSearch } from "./web-search";
import { researchToolMetadata } from "./research-registry";

describe("Research Tools", () => {
  describe("Tool Metadata Registry", () => {
    it("should have metadata for all research tools", () => {
      const expectedTools = [
        "getStoryHighlights",
        "summarizeSources",
        "draftBrief",
        "planPlaybook",
        "linkInsights",
        "webSearch",
      ];

      expectedTools.forEach((toolName) => {
        expect(researchToolMetadata).toHaveProperty(toolName);
        expect(researchToolMetadata[toolName]).toHaveProperty("description");
        expect(researchToolMetadata[toolName]).toHaveProperty("parameters");
      });
    });

    it("should have valid Zod schemas for parameters", () => {
      Object.values(researchToolMetadata).forEach((metadata) => {
        expect(metadata.parameters).toBeDefined();
        expect(metadata.parameters._def).toBeDefined(); // Zod schema check
      });
    });
  });

  describe("getStoryHighlights", () => {
    it("should extract highlights from a story", async () => {
      const input = {
        storyId: "story-123",
        includeQuotes: true,
        maxHighlights: 5,
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      // Mock database or API calls
      const mockGetStory = vi.fn().mockResolvedValue({
        id: "story-123",
        title: "AI Breakthrough",
        content: "Researchers announced a major breakthrough...",
        highlights: [
          "Revolutionary new algorithm",
          "50% performance improvement",
          "Real-world applications",
        ],
      });

      // Replace the actual implementation with mock
      const originalGetStory = global.getStoryFromDb;
      global.getStoryFromDb = mockGetStory;

      const result = await getStoryHighlights(input, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("highlights");
      expect(result.data.highlights).toBeInstanceOf(Array);
      expect(result.data.highlights.length).toBeLessThanOrEqual(5);

      // Restore original
      global.getStoryFromDb = originalGetStory;
    });

    it("should handle story not found", async () => {
      const input = {
        storyId: "non-existent",
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      const result = await getStoryHighlights(input, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("summarizeSources", () => {
    it("should summarize multiple sources", async () => {
      const input = {
        sourceIds: ["source-1", "source-2"],
        summaryType: "executive",
        maxLength: 500,
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      // Mock source fetching
      const mockGetSources = vi.fn().mockResolvedValue([
        {
          id: "source-1",
          title: "Market Analysis",
          content: "The market is showing strong growth...",
        },
        {
          id: "source-2",
          title: "Competitor Update",
          content: "Competitors are launching new products...",
        },
      ]);

      global.getSourcesFromDb = mockGetSources;

      const result = await summarizeSources(input, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("summary");
      expect(result.data.summary.length).toBeLessThanOrEqual(500);
      expect(result.data).toHaveProperty("keyPoints");
      expect(result.data.keyPoints).toBeInstanceOf(Array);

      global.getSourcesFromDb = undefined;
    });

    it("should handle empty source list", async () => {
      const input = {
        sourceIds: [],
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      const result = await summarizeSources(input, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No sources");
    });
  });

  describe("draftBrief", () => {
    it("should create a research brief", async () => {
      const input = {
        topic: "AI Market Trends",
        audience: "executives",
        length: "medium",
        includeSources: true,
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      const result = await draftBrief(input, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("title");
      expect(result.data).toHaveProperty("executiveSummary");
      expect(result.data).toHaveProperty("sections");
      expect(result.data.sections).toBeInstanceOf(Array);
      expect(result.data).toHaveProperty("recommendations");

      if (input.includeSources) {
        expect(result.data).toHaveProperty("sources");
      }
    });

    it("should validate audience parameter", async () => {
      const input = {
        topic: "Test Topic",
        audience: "invalid-audience", // Not in enum
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      const result = await draftBrief(input, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid audience");
    });
  });

  describe("webSearch", () => {
    it("should perform web search and return results", async () => {
      const input = {
        query: "latest AI developments 2024",
        maxResults: 10,
        timeRange: "week",
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      // Mock search API
      const mockSearch = vi.fn().mockResolvedValue({
        results: [
          {
            title: "Major AI Breakthrough",
            url: "https://example.com/article1",
            snippet: "Scientists announce...",
            publishedDate: "2024-12-01",
          },
          {
            title: "AI Industry Report",
            url: "https://example.com/article2",
            snippet: "Industry analysis shows...",
            publishedDate: "2024-12-02",
          },
        ],
      });

      global.performWebSearch = mockSearch;

      const result = await webSearch(input, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("results");
      expect(result.data.results).toBeInstanceOf(Array);
      expect(result.data.results.length).toBeLessThanOrEqual(10);
      expect(result.data.results[0]).toHaveProperty("title");
      expect(result.data.results[0]).toHaveProperty("url");

      global.performWebSearch = undefined;
    });

    it("should handle search API errors", async () => {
      const input = {
        query: "test query",
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      // Mock search API failure
      const mockSearch = vi.fn().mockRejectedValue(new Error("API rate limit"));

      global.performWebSearch = mockSearch;

      const result = await webSearch(input, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("rate limit");

      global.performWebSearch = undefined;
    });

    it("should validate time range parameter", async () => {
      const input = {
        query: "test",
        timeRange: "invalid-range", // Not in enum
      };

      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      const result = await webSearch(input, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid time range");
    });
  });

  describe("Tool Error Handling", () => {
    it("should handle missing context", async () => {
      const input = { storyId: "story-123" };

      // Missing teamId
      const invalidContext = {
        userId: "user-789",
      };

      const result = await getStoryHighlights(input, invalidContext as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Team context required");
    });

    it("should handle database connection errors", async () => {
      const input = { storyId: "story-123" };
      const context = {
        teamId: "team-456",
        userId: "user-789",
      };

      // Mock database error
      const mockGetStory = vi
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));

      global.getStoryFromDb = mockGetStory;

      const result = await getStoryHighlights(input, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database");

      global.getStoryFromDb = undefined;
    });
  });
});
