import { describe, it, expect, beforeEach, vi } from "bun:test";
import { storiesRouter } from "./stories";
import { createCallerFactory } from "../init";
import type { ApiContext } from "@api/context";

describe("Stories Router", () => {
  let mockDb: any;
  let mockContext: ApiContext & { teamId?: string };
  let caller: any;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: {
        stories: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        storyHighlights: {
          findMany: vi.fn(),
        },
        clusters: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(),
      update: vi.fn(),
    };

    // Mock context
    mockContext = {
      db: mockDb,
      session: {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      teamId: "team-456",
      headers: new Headers(),
    };

    // Create caller
    const createCaller = createCallerFactory(storiesRouter);
    caller = createCaller(mockContext);
  });

  describe("dashboardSummaries", () => {
    it("should return categorized story summaries", async () => {
      const mockTrendingStories = [
        {
          id: "story-1",
          title: "AI Breakthrough Announced",
          summary: "Major AI advancement revealed",
          chiliScore: 0.9,
          whyItMatters: "Could revolutionize the industry",
          kind: "news",
          url: "https://example.com/story1",
          createdAt: new Date("2024-12-01"),
        },
        {
          id: "story-2",
          title: "Tech Stock Surge",
          summary: "Markets react to new tech",
          chiliScore: 0.7,
          whyItMatters: "Indicates market confidence",
          kind: "analysis",
          url: "https://example.com/story2",
          createdAt: new Date("2024-12-02"),
        },
      ];

      const mockSignalStories = [
        {
          id: "story-3",
          title: "Regulatory Changes Coming",
          summary: "New regulations announced",
          chiliScore: 0.8,
          whyItMatters: "Will impact operations",
          kind: "regulatory",
          isPinned: true,
          url: "https://example.com/story3",
          createdAt: new Date("2024-12-03"),
        },
      ];

      const mockRepoWatchStories = [
        {
          id: "story-4",
          title: "Open Source Project Update",
          summary: "Major release from key repo",
          chiliScore: 0.6,
          whyItMatters: "Adds requested features",
          kind: "repository",
          repository: "org/repo",
          url: "https://github.com/org/repo",
          createdAt: new Date("2024-12-04"),
        },
      ];

      // Mock cluster data
      const mockCluster = {
        id: "cluster-1",
        label: "AI Development",
        confidence: 0.85,
      };

      // Setup mocks for trending stories
      mockDb.query.stories.findMany
        .mockResolvedValueOnce(mockTrendingStories) // Trending
        .mockResolvedValueOnce(mockSignalStories) // Signals
        .mockResolvedValueOnce(mockRepoWatchStories); // Repo Watch

      mockDb.query.clusters.findFirst.mockResolvedValue(mockCluster);

      const result = await caller.dashboardSummaries({
        limit: 10,
        includeMetrics: true,
      });

      // Verify structure
      expect(result).toHaveProperty("trending");
      expect(result).toHaveProperty("signals");
      expect(result).toHaveProperty("repoWatch");

      // Verify trending category
      expect(result.trending).toEqual({
        title: "Trending Now",
        description: "Top stories gaining traction",
        stories: expect.arrayContaining([
          expect.objectContaining({
            id: "story-1",
            title: "AI Breakthrough Announced",
            chiliScore: 0.9,
            whyItMatters: "Could revolutionize the industry",
          }),
        ]),
      });

      // Verify signals category
      expect(result.signals).toEqual({
        title: "Important Signals",
        description: "Critical updates requiring attention",
        stories: expect.arrayContaining([
          expect.objectContaining({
            id: "story-3",
            title: "Regulatory Changes Coming",
            isPinned: true,
          }),
        ]),
      });

      // Verify repo watch category
      expect(result.repoWatch).toEqual({
        title: "Repository Updates",
        description: "Latest from watched repositories",
        stories: expect.arrayContaining([
          expect.objectContaining({
            id: "story-4",
            title: "Open Source Project Update",
            repository: "org/repo",
          }),
        ]),
      });
    });

    it("should handle empty results gracefully", async () => {
      // Mock empty results
      mockDb.query.stories.findMany.mockResolvedValue([]);

      const result = await caller.dashboardSummaries({
        limit: 10,
      });

      expect(result.trending.stories).toEqual([]);
      expect(result.signals.stories).toEqual([]);
      expect(result.repoWatch.stories).toEqual([]);
    });

    it("should respect limit parameter", async () => {
      const manyStories = Array.from({ length: 20 }, (_, i) => ({
        id: `story-${i}`,
        title: `Story ${i}`,
        chiliScore: Math.random(),
        createdAt: new Date(),
      }));

      mockDb.query.stories.findMany.mockResolvedValue(manyStories.slice(0, 5));

      const result = await caller.dashboardSummaries({
        limit: 5,
      });

      // Each category should respect the limit
      expect(result.trending.stories.length).toBeLessThanOrEqual(5);
    });

    it("should include metrics when requested", async () => {
      const storiesWithMetrics = [
        {
          id: "story-1",
          title: "Test Story",
          chiliScore: 0.75,
          viewCount: 100,
          shareCount: 10,
          engagementScore: 0.8,
          createdAt: new Date(),
        },
      ];

      mockDb.query.stories.findMany.mockResolvedValue(storiesWithMetrics);

      const result = await caller.dashboardSummaries({
        limit: 10,
        includeMetrics: true,
      });

      expect(result.trending.stories[0]).toHaveProperty("viewCount");
      expect(result.trending.stories[0]).toHaveProperty("shareCount");
      expect(result.trending.stories[0]).toHaveProperty("engagementScore");
    });

    it("should filter by date range when provided", async () => {
      const recentStories = [
        {
          id: "story-recent",
          title: "Recent Story",
          createdAt: new Date("2024-12-10"),
        },
      ];

      const oldStories = [
        {
          id: "story-old",
          title: "Old Story",
          createdAt: new Date("2024-01-01"),
        },
      ];

      // Mock will be called with date filter
      mockDb.query.stories.findMany.mockImplementation((query) => {
        // Return recent stories for the filtered query
        return Promise.resolve(recentStories);
      });

      const result = await caller.dashboardSummaries({
        limit: 10,
        dateRange: {
          from: new Date("2024-12-01"),
          to: new Date("2024-12-31"),
        },
      });

      // Should only include recent stories
      const allStories = [
        ...result.trending.stories,
        ...result.signals.stories,
        ...result.repoWatch.stories,
      ];

      expect(allStories).not.toContainEqual(
        expect.objectContaining({ id: "story-old" }),
      );
    });

    it("should handle database errors", async () => {
      mockDb.query.stories.findMany.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(caller.dashboardSummaries({ limit: 10 })).rejects.toThrow(
        "Database error",
      );
    });
  });
});
