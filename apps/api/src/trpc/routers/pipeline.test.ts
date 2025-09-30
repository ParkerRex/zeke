import { describe, it, expect, beforeEach, vi } from "bun:test";
import { pipelineRouter } from "./pipeline";
import { createCallerFactory } from "../init";
import type { ApiContext } from "@api/context";

describe("Pipeline Router", () => {
  let mockDb: any;
  let mockContext: ApiContext & { teamId?: string };
  let caller: any;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: {
        ingestionJobs: {
          findMany: vi.fn(),
        },
        sources: {
          findMany: vi.fn(),
        },
        playbooks: {
          findMany: vi.fn(),
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
    const createCaller = createCallerFactory(pipelineRouter);
    caller = createCaller(mockContext);
  });

  describe("dashboardStatus", () => {
    it("should return complete pipeline status", async () => {
      const mockActiveJobs = [
        {
          id: "job-1",
          sourceId: "source-1",
          status: "processing",
          progress: 45,
          startedAt: new Date("2024-12-01T10:00:00"),
        },
        {
          id: "job-2",
          sourceId: "source-2",
          status: "queued",
          startedAt: new Date("2024-12-01T10:05:00"),
        },
      ];

      const mockRecentJobs = [
        {
          id: "job-3",
          sourceId: "source-3",
          status: "completed",
          completedAt: new Date("2024-12-01T09:00:00"),
          itemsProcessed: 100,
        },
        {
          id: "job-4",
          sourceId: "source-4",
          status: "failed",
          completedAt: new Date("2024-12-01T08:00:00"),
          error: "Connection timeout",
        },
      ];

      const mockSources = [
        {
          id: "source-1",
          name: "Tech News Feed",
          type: "rss",
          status: "active",
          lastIngestion: new Date("2024-12-01T09:00:00"),
          health: "healthy",
        },
        {
          id: "source-2",
          name: "GitHub Repos",
          type: "github",
          status: "active",
          lastIngestion: new Date("2024-12-01T08:00:00"),
          health: "warning",
        },
        {
          id: "source-3",
          name: "Broken Feed",
          type: "api",
          status: "error",
          health: "error",
        },
      ];

      // Mock active jobs
      mockDb.query.ingestionJobs.findMany
        .mockResolvedValueOnce(mockActiveJobs) // Active/queued
        .mockResolvedValueOnce(mockRecentJobs); // Recent completed/failed

      // Mock sources
      mockDb.query.sources.findMany.mockResolvedValue(mockSources);

      const result = await caller.dashboardStatus();

      // Verify structure
      expect(result).toHaveProperty("activeJobs");
      expect(result).toHaveProperty("recentJobs");
      expect(result).toHaveProperty("sources");
      expect(result).toHaveProperty("stats");
      expect(result).toHaveProperty("health");

      // Verify active jobs
      expect(result.activeJobs).toHaveLength(2);
      expect(result.activeJobs[0]).toEqual(
        expect.objectContaining({
          id: "job-1",
          status: "processing",
          progress: 45,
        }),
      );

      // Verify recent jobs
      expect(result.recentJobs).toHaveLength(2);
      expect(result.recentJobs[0]).toEqual(
        expect.objectContaining({
          id: "job-3",
          status: "completed",
          itemsProcessed: 100,
        }),
      );

      // Verify sources
      expect(result.sources).toHaveLength(3);
      expect(result.sources[0]).toEqual(
        expect.objectContaining({
          name: "Tech News Feed",
          type: "rss",
          health: "healthy",
        }),
      );

      // Verify stats
      expect(result.stats).toEqual({
        totalActive: 2,
        totalQueued: 1,
        totalProcessing: 1,
        successRate: 0.5, // 1 success, 1 failure
        avgProcessingTime: expect.any(Number),
      });

      // Verify health status
      expect(result.health).toEqual({
        overall: "warning", // Has warning source
        errors: 1, // One error source
        warnings: 1, // One warning source
        healthy: 1, // One healthy source
      });
    });

    it("should handle empty pipeline", async () => {
      mockDb.query.ingestionJobs.findMany.mockResolvedValue([]);
      mockDb.query.sources.findMany.mockResolvedValue([]);

      const result = await caller.dashboardStatus();

      expect(result.activeJobs).toEqual([]);
      expect(result.recentJobs).toEqual([]);
      expect(result.sources).toEqual([]);
      expect(result.stats.totalActive).toBe(0);
      expect(result.health.overall).toBe("healthy");
    });

    it("should calculate health status correctly", async () => {
      // All sources healthy
      mockDb.query.sources.findMany.mockResolvedValue([
        { id: "1", health: "healthy" },
        { id: "2", health: "healthy" },
      ]);
      mockDb.query.ingestionJobs.findMany.mockResolvedValue([]);

      let result = await caller.dashboardStatus();
      expect(result.health.overall).toBe("healthy");

      // Has errors
      mockDb.query.sources.findMany.mockResolvedValue([
        { id: "1", health: "healthy" },
        { id: "2", health: "error" },
      ]);

      result = await caller.dashboardStatus();
      expect(result.health.overall).toBe("error");

      // Has warnings but no errors
      mockDb.query.sources.findMany.mockResolvedValue([
        { id: "1", health: "healthy" },
        { id: "2", health: "warning" },
      ]);

      result = await caller.dashboardStatus();
      expect(result.health.overall).toBe("warning");
    });
  });

  describe("quickActions", () => {
    describe("ingestUrl", () => {
      it("should ingest a URL with priority", async () => {
        const mockJob = {
          id: "job-123",
          url: "https://example.com/article",
          priority: "high",
          status: "queued",
          createdAt: new Date(),
        };

        mockDb.insert.mockResolvedValue(mockJob);

        const result = await caller.quickActions.ingestUrl({
          url: "https://example.com/article",
          priority: "high",
        });

        expect(result).toEqual({
          success: true,
          jobId: "job-123",
          status: "queued",
        });

        expect(mockDb.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            teamId: "team-456",
            url: "https://example.com/article",
            priority: "high",
          }),
        );
      });

      it("should validate URL format", async () => {
        await expect(
          caller.quickActions.ingestUrl({
            url: "not-a-valid-url",
            priority: "normal",
          }),
        ).rejects.toThrow();
      });

      it("should handle ingestion errors", async () => {
        mockDb.insert.mockRejectedValue(new Error("Queue full"));

        const result = await caller.quickActions.ingestUrl({
          url: "https://example.com",
          priority: "normal",
        });

        expect(result).toEqual({
          success: false,
          error: "Queue full",
        });
      });
    });

    describe("runPlaybook", () => {
      it("should execute a playbook", async () => {
        const mockPlaybook = {
          id: "playbook-1",
          name: "Daily Analysis",
          steps: [
            { id: "step-1", action: "fetch" },
            { id: "step-2", action: "analyze" },
          ],
        };

        const mockExecution = {
          id: "exec-123",
          playbookId: "playbook-1",
          status: "running",
          startedAt: new Date(),
        };

        mockDb.query.playbooks.findFirst.mockResolvedValue(mockPlaybook);
        mockDb.insert.mockResolvedValue(mockExecution);

        const result = await caller.quickActions.runPlaybook({
          playbookId: "playbook-1",
          context: { source: "manual" },
        });

        expect(result).toEqual({
          success: true,
          executionId: "exec-123",
          status: "running",
        });
      });

      it("should handle missing playbook", async () => {
        mockDb.query.playbooks.findFirst.mockResolvedValue(null);

        const result = await caller.quickActions.runPlaybook({
          playbookId: "non-existent",
        });

        expect(result).toEqual({
          success: false,
          error: expect.stringContaining("not found"),
        });
      });

      it("should handle execution errors", async () => {
        mockDb.query.playbooks.findFirst.mockResolvedValue({
          id: "playbook-1",
        });
        mockDb.insert.mockRejectedValue(new Error("Execution failed"));

        const result = await caller.quickActions.runPlaybook({
          playbookId: "playbook-1",
        });

        expect(result).toEqual({
          success: false,
          error: "Execution failed",
        });
      });
    });
  });

  it("should handle database errors gracefully", async () => {
    mockDb.query.ingestionJobs.findMany.mockRejectedValue(
      new Error("Database connection failed"),
    );

    await expect(caller.dashboardStatus()).rejects.toThrow(
      "Database connection failed",
    );
  });
});
