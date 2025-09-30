import { describe, it, expect, beforeEach, vi } from "bun:test";
import { insightsRouter } from "./insights";
import { createCallerFactory } from "../init";
import type { ApiContext } from "@api/context";

describe("Insights Router", () => {
  let mockDb: any;
  let mockContext: ApiContext & { teamId?: string };
  let caller: any;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: {
        insights: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        userGoals: {
          findMany: vi.fn(),
        },
        teams: {
          findFirst: vi.fn(),
        },
        insightLinks: {
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(),
      update: vi.fn(),
    };

    // Mock context for paid user
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

    // Mock team with active subscription by default
    mockDb.query.teams.findFirst.mockResolvedValue({
      id: "team-456",
      subscriptionStatus: "active",
      subscriptionTier: "paid",
    });

    // Create caller
    const createCaller = createCallerFactory(insightsRouter);
    caller = createCaller(mockContext);
  });

  describe("personalizedFeed", () => {
    it("should return personalized insights for paid users", async () => {
      const mockInsights = [
        {
          id: "insight-1",
          title: "Market Trend Analysis",
          content: "Key market indicators show...",
          kind: "insight",
          confidence: 0.85,
          tags: ["market", "analysis"],
          goalId: "goal-1",
          createdAt: new Date("2024-12-01"),
        },
        {
          id: "insight-2",
          title: "Competitive Intelligence",
          content: "Competitor activity suggests...",
          kind: "action",
          confidence: 0.75,
          tags: ["competition"],
          goalId: "goal-1",
          createdAt: new Date("2024-12-02"),
        },
        {
          id: "insight-3",
          title: "Customer Feedback Summary",
          content: "Recent feedback indicates...",
          kind: "quote",
          confidence: 0.9,
          tags: ["customer", "feedback"],
          goalId: "goal-2",
          createdAt: new Date("2024-12-03"),
        },
      ];

      const mockGoals = [
        {
          id: "goal-1",
          name: "Market Expansion",
          priority: 1,
        },
        {
          id: "goal-2",
          name: "Customer Satisfaction",
          priority: 2,
        },
      ];

      mockDb.query.userGoals.findMany.mockResolvedValue(mockGoals);
      mockDb.query.insights.findMany
        .mockResolvedValueOnce(mockInsights) // Main query
        .mockResolvedValueOnce(mockInsights); // Count query

      const result = await caller.personalizedFeed({
        page: 1,
        limit: 10,
      });

      // Verify structure
      expect(result).toHaveProperty("insights");
      expect(result).toHaveProperty("totalCount");
      expect(result).toHaveProperty("hasMore");
      expect(result).toHaveProperty("filters");

      // Verify insights
      expect(result.insights).toHaveLength(3);
      expect(result.insights[0]).toEqual(
        expect.objectContaining({
          id: "insight-1",
          title: "Market Trend Analysis",
          kind: "insight",
          confidence: 0.85,
        }),
      );

      // Verify pagination
      expect(result.totalCount).toBe(3);
      expect(result.hasMore).toBe(false);

      // Verify filters are included
      expect(result.filters).toEqual({
        goals: mockGoals,
        tags: expect.any(Array),
        kinds: ["insight", "quote", "action", "question"],
      });
    });

    it("should lock feed for free users", async () => {
      // Mock free tier
      mockDb.query.teams.findFirst.mockResolvedValue({
        id: "team-456",
        subscriptionStatus: "inactive",
        subscriptionTier: "free",
      });

      const mockSampleInsights = [
        {
          id: "sample-1",
          title: "Sample Insight 1",
          content: "This is a sample...",
          kind: "insight",
          confidence: 0.7,
          isLocked: true,
          createdAt: new Date(),
        },
        {
          id: "sample-2",
          title: "Sample Insight 2",
          content: "Another sample...",
          kind: "quote",
          confidence: 0.8,
          isLocked: true,
          createdAt: new Date(),
        },
      ];

      mockDb.query.insights.findMany.mockResolvedValue(mockSampleInsights);

      const result = await caller.personalizedFeed({
        page: 1,
        limit: 10,
      });

      // Free users should see locked insights
      expect(result.insights).toHaveLength(2);
      expect(result.insights[0].isLocked).toBe(true);
      expect(result.insights[1].isLocked).toBe(true);

      // Should include upgrade prompt
      expect(result).toHaveProperty("upgradePrompt");
    });

    it("should filter by goals when specified", async () => {
      const goalFilteredInsights = [
        {
          id: "insight-goal-1",
          title: "Goal-specific Insight",
          goalId: "goal-1",
          kind: "insight",
          createdAt: new Date(),
        },
      ];

      mockDb.query.insights.findMany.mockImplementation((query) => {
        // Return filtered insights
        return Promise.resolve(goalFilteredInsights);
      });

      const result = await caller.personalizedFeed({
        page: 1,
        limit: 10,
        filters: {
          goals: ["goal-1"],
        },
      });

      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].goalId).toBe("goal-1");
    });

    it("should filter by tags when specified", async () => {
      const tagFilteredInsights = [
        {
          id: "insight-tag-1",
          title: "Tagged Insight",
          tags: ["technology", "ai"],
          kind: "insight",
          createdAt: new Date(),
        },
      ];

      mockDb.query.insights.findMany.mockImplementation((query) => {
        return Promise.resolve(tagFilteredInsights);
      });

      const result = await caller.personalizedFeed({
        page: 1,
        limit: 10,
        filters: {
          tags: ["technology"],
        },
      });

      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].tags).toContain("technology");
    });

    it("should sort by relevance when specified", async () => {
      const insights = [
        {
          id: "insight-1",
          confidence: 0.95,
          relevanceScore: 0.9,
          createdAt: new Date("2024-12-01"),
        },
        {
          id: "insight-2",
          confidence: 0.85,
          relevanceScore: 0.95,
          createdAt: new Date("2024-12-02"),
        },
        {
          id: "insight-3",
          confidence: 0.75,
          relevanceScore: 0.8,
          createdAt: new Date("2024-12-03"),
        },
      ];

      mockDb.query.insights.findMany.mockResolvedValue(insights);

      const result = await caller.personalizedFeed({
        page: 1,
        limit: 10,
        sortBy: "relevant",
      });

      // Should be sorted by relevance score
      expect(result.insights[0].relevanceScore).toBeGreaterThanOrEqual(
        result.insights[1].relevanceScore,
      );
    });

    it("should handle pagination correctly", async () => {
      const allInsights = Array.from({ length: 25 }, (_, i) => ({
        id: `insight-${i}`,
        title: `Insight ${i}`,
        kind: "insight",
        createdAt: new Date(),
      }));

      // Return different slices for different pages
      mockDb.query.insights.findMany.mockImplementation((query) => {
        // Simple pagination simulation
        return Promise.resolve(allInsights.slice(10, 20));
      });

      const result = await caller.personalizedFeed({
        page: 2,
        limit: 10,
      });

      expect(result.insights).toHaveLength(10);
      expect(result.hasMore).toBe(true);
    });

    it("should handle no team context", async () => {
      const noTeamContext = {
        ...mockContext,
        teamId: undefined,
      };

      const createCaller = createCallerFactory(insightsRouter);
      const noTeamCaller = createCaller(noTeamContext);

      // Should return limited/sample insights
      const sampleInsights = [
        {
          id: "sample-1",
          title: "Sample Insight",
          kind: "insight",
          isLocked: true,
          createdAt: new Date(),
        },
      ];

      mockDb.query.insights.findMany.mockResolvedValue(sampleInsights);

      const result = await noTeamCaller.personalizedFeed({
        page: 1,
        limit: 10,
      });

      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].isLocked).toBe(true);
    });

    it("should handle database errors", async () => {
      mockDb.query.insights.findMany.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        caller.personalizedFeed({ page: 1, limit: 10 }),
      ).rejects.toThrow("Database error");
    });
  });
});
