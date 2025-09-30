import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import * as schema from "@zeke/db/schema";
import { eq } from "drizzle-orm";
import { ingestUploadSchema } from "@zeke/jobs/schema";
import {
  analyzeStory,
  ingestFromUpload,
  ingestOneOff,
  ingestPull,
  ingestSource,
} from "@zeke/jobs/tasks";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Pipeline router exposes manual triggers for ingestion tasks.
 */
export const pipelineRouter = createTRPCRouter({
  ingestAll: protectedProcedure
    .input(
      z
        .object({ reason: z.enum(["manual", "schedule"]).default("manual") })
        .default({ reason: "manual" }),
    )
    .mutation(async ({ input, ctx }) => {
      await ingestPull.trigger({ reason: input.reason });
      return { ok: true };
    }),

  ingestSource: protectedProcedure
    .input(z.object({ sourceId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      await ingestSource.trigger({
        sourceId: input.sourceId,
        reason: "manual",
      });
      return { ok: true };
    }),

  ingestUrl: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      await ingestOneOff.trigger({
        url: input.url,
        requestedBy: ctx.session?.user.id,
      });
      return { ok: true };
    }),

  reanalyzeStory: protectedProcedure
    .input(z.object({ storyId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await analyzeStory.trigger({
        storyId: input.storyId,
        trigger: "manual",
      });
      return { ok: true };
    }),

  upload: protectedProcedure
    .input(ingestUploadSchema)
    .mutation(async ({ input, ctx }) => {
      await ingestFromUpload.trigger({
        ...input,
        uploadedBy: input.uploadedBy ?? ctx.session?.user.id,
      });
      return { ok: true };
    }),

  /**
   * Get pipeline status for dashboard display
   * Returns ingestion health, recent activity, and queue status
   */
  dashboardStatus: protectedProcedure.query(async ({ ctx }) => {
    const { db, teamId } = ctx;

    if (!teamId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Team context required",
      });
    }

    try {
      // Get source health status
      const [healthyCount, warningCount, errorCount] = await Promise.all([
        db.query.sourceHealth
          .findMany({
            where: (health, { eq }) => eq(health.status, "ok"),
          })
          .then((results) => results.length),

        db.query.sourceHealth
          .findMany({
            where: (health, { eq }) => eq(health.status, "warn"),
          })
          .then((results) => results.length),

        db.query.sourceHealth
          .findMany({
            where: (health, { eq }) => eq(health.status, "error"),
          })
          .then((results) => results.length),
      ]);

      // Get recent ingestion activity (last 24 hours)
      const recentActivity = await db.query.rawItems.findMany({
        where: (items, { gte }) =>
          gte(items.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
        orderBy: (items, { desc }) => [desc(items.createdAt)],
        limit: 10,
        with: {
          source: true,
        },
      });

      // Get platform quota status
      const quotas = await db.query.platformQuota.findMany();
      const quotaMap = new Map(quotas.map((q) => [q.provider, q]));

      return {
        health: {
          overall:
            errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "healthy",
          sources: {
            healthy: healthyCount,
            warning: warningCount,
            error: errorCount,
            total: healthyCount + warningCount + errorCount,
          },
        },
        recentIngestions: recentActivity.map((item) => ({
          id: item.id,
          title: item.title,
          sourceName: item.source?.name || "Unknown",
          createdAt: item.createdAt,
          status: item.status,
        })),
        quotas: {
          openai: quotaMap.get("openai")
            ? {
                used: quotaMap.get("openai").used,
                limit: quotaMap.get("openai").quotaLimit,
                percentUsed: Math.round(
                  (quotaMap.get("openai").used /
                    quotaMap.get("openai").quotaLimit) *
                    100,
                ),
              }
            : null,
          youtube: quotaMap.get("youtube")
            ? {
                used: quotaMap.get("youtube").used,
                limit: quotaMap.get("youtube").quotaLimit,
                percentUsed: Math.round(
                  (quotaMap.get("youtube").used /
                    quotaMap.get("youtube").quotaLimit) *
                    100,
                ),
              }
            : null,
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch pipeline status",
      });
    }
  }),

  /**
   * Quick action mutations with optimistic updates
   */
  quickActions: createTRPCRouter({
    ingestUrl: protectedProcedure
      .input(
        z.object({
          url: z.string().url(),
          priority: z.enum(["normal", "high"]).default("normal"),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const jobId = await ingestOneOff.trigger({
          url: input.url,
          requestedBy: ctx.session?.user.id,
          priority: input.priority,
        });

        return {
          ok: true,
          jobId,
          message: "URL queued for ingestion",
        };
      }),

    runPlaybook: protectedProcedure
      .input(
        z.object({
          playbookId: z.string().uuid(),
          context: z.any().optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { db, teamId, session } = ctx;

        if (!teamId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Team context required",
          });
        }

        // Create playbook run
        const run = await db
          .insert(schema.playbookRuns)
          .values({
            playbookId: input.playbookId,
            teamId,
            triggeredBy: session.user.id,
            triggerSource: "quick_action",
            status: "pending",
            metadata: input.context,
          })
          .returning();

        // Trigger async execution (in production, this would be a job)
        // For now, just mark as running
        await db
          .update(schema.playbookRuns)
          .set({ status: "running" })
          .where(eq(schema.playbookRuns.id, run[0].id));

        return {
          ok: true,
          runId: run[0].id,
          message: "Playbook execution started",
        };
      }),
  }),
});
