import { describe, it, expect, beforeEach, vi } from "bun:test";
import { workspaceRouter } from "./workspace";
import { createCallerFactory } from "../init";
import type { ApiContext } from "@api/context";

describe("Workspace Router", () => {
  let mockDb: any;
  let mockContext: ApiContext & { teamId?: string };
  let caller: any;

  beforeEach(() => {
    // Mock database queries
    mockDb = {
      query: {
        users: {
          findFirst: vi.fn(),
        },
        teams: {
          findFirst: vi.fn(),
        },
        teamMembers: {
          findFirst: vi.fn(),
        },
        chats: {
          findMany: vi.fn(),
        },
        stories: {
          findMany: vi.fn(),
        },
        insights: {
          findMany: vi.fn(),
        },
        sources: {
          findMany: vi.fn(),
        },
        notifications: {
          findMany: vi.fn(),
        },
      },
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
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
    const createCaller = createCallerFactory(workspaceRouter);
    caller = createCaller(mockContext);
  });

  describe("bootstrap", () => {
    it("should return complete bootstrap data for authenticated user", async () => {
      // Mock user data
      mockDb.query.users.findFirst.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        fullName: "Test User",
        avatarUrl: "https://example.com/avatar.png",
        locale: "en",
        preferences: { theme: "dark" },
      });

      // Mock team data
      mockDb.query.teams.findFirst.mockResolvedValue({
        id: "team-456",
        name: "Test Team",
        logoUrl: "https://example.com/logo.png",
        subscriptionStatus: "active",
        subscriptionTier: "paid",
        trialEndsAt: null,
      });

      // Mock team membership
      mockDb.query.teamMembers.findFirst.mockResolvedValue({
        role: "admin",
        joinedAt: new Date("2024-01-01"),
      });

      // Mock nav counts
      mockDb.query.stories.findMany.mockResolvedValue([
        { id: "story-1" },
        { id: "story-2" },
        { id: "story-3" },
      ]);

      mockDb.query.insights.findMany.mockResolvedValue([
        { id: "insight-1" },
        { id: "insight-2" },
      ]);

      mockDb.query.sources.findMany.mockResolvedValue([{ id: "source-1" }]);

      mockDb.query.notifications.findMany.mockResolvedValue([
        { id: "notif-1", read: false },
        { id: "notif-2", read: false },
        { id: "notif-3", read: false },
        { id: "notif-4", read: false },
        { id: "notif-5", read: false },
      ]);

      // Mock assistant summary
      mockDb.query.chats.findMany
        .mockResolvedValueOnce([
          { createdAt: new Date("2024-12-01") },
          { createdAt: new Date("2024-12-02") },
          { createdAt: new Date("2024-12-03") },
        ]) // 7 days
        .mockResolvedValueOnce([
          { createdAt: new Date("2024-11-01") },
          { createdAt: new Date("2024-11-02") },
        ]); // 30 days

      const result = await caller.bootstrap();

      // Verify structure
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("team");
      expect(result).toHaveProperty("navCounts");
      expect(result).toHaveProperty("banners");
      expect(result).toHaveProperty("assistantSummary");

      // Verify user data
      expect(result.user).toEqual({
        id: "user-123",
        email: "test@example.com",
        fullName: "Test User",
        avatarUrl: "https://example.com/avatar.png",
        locale: "en",
        preferences: { theme: "dark" },
      });

      // Verify team data
      expect(result.team).toEqual({
        id: "team-456",
        name: "Test Team",
        logoUrl: "https://example.com/logo.png",
        role: "admin",
        subscriptionStatus: "active",
        subscriptionTier: "paid",
        trialEndsAt: null,
      });

      // Verify nav counts
      expect(result.navCounts).toEqual({
        stories: 3,
        insights: 2,
        sources: 1,
        playbooks: 0,
        notifications: 5,
      });

      // Verify banners
      expect(result.banners).toEqual({
        trial: null,
        subscription: null,
        announcement: null,
      });

      // Verify assistant summary
      expect(result.assistantSummary).toEqual({
        last7Days: 3,
        last30Days: 2,
        totalChats: expect.any(Number),
      });
    });

    it("should handle trial ending soon banner", async () => {
      const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

      // Mock user and team with trial
      mockDb.query.users.findFirst.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      });

      mockDb.query.teams.findFirst.mockResolvedValue({
        id: "team-456",
        name: "Test Team",
        subscriptionStatus: "trialing",
        trialEndsAt,
      });

      mockDb.query.teamMembers.findFirst.mockResolvedValue({
        role: "owner",
      });

      // Mock empty counts
      mockDb.query.stories.findMany.mockResolvedValue([]);
      mockDb.query.insights.findMany.mockResolvedValue([]);
      mockDb.query.sources.findMany.mockResolvedValue([]);
      mockDb.query.notifications.findMany.mockResolvedValue([]);
      mockDb.query.chats.findMany.mockResolvedValue([]);

      const result = await caller.bootstrap();

      expect(result.banners.trial).toEqual({
        type: "warning",
        message: expect.stringContaining("Trial ends in 3 days"),
        action: "Upgrade to Pro",
        actionUrl: "/settings/billing",
      });
    });

    it("should handle no team context", async () => {
      // Create context without team
      const noTeamContext = {
        ...mockContext,
        teamId: undefined,
      };

      const createCaller = createCallerFactory(workspaceRouter);
      const noTeamCaller = createCaller(noTeamContext);

      // Mock user
      mockDb.query.users.findFirst.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      });

      const result = await noTeamCaller.bootstrap();

      expect(result.team).toBeNull();
      expect(result.navCounts).toEqual({
        stories: 0,
        insights: 0,
        sources: 0,
        playbooks: 0,
        notifications: 0,
      });
    });

    it("should handle database errors gracefully", async () => {
      // Mock database error
      mockDb.query.users.findFirst.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(caller.bootstrap()).rejects.toThrow(
        "Database connection failed",
      );
    });
  });
});
