import type { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { runPlaybookSchema } from "@jobs/schema";
import {
  createPlaybookRun,
  recordPlaybookRunEvent,
  updatePlaybookRunStatus,
  updatePlaybookStatus,
} from "@zeke/db/queries";

import { branchContent } from "./steps/branch-content";
import { finalizeRun } from "./steps/finalize";
import { gatherContext } from "./steps/gather-context";

export const runPlaybook = schemaTask({
  id: "playbook-run",
  schema: runPlaybookSchema,
  queue: {
    concurrencyLimit: 2,
  },
  run: async (
    {
      playbookId,
      teamId,
      triggeredBy,
      triggerSource,
      metadata,
    }: z.infer<typeof runPlaybookSchema>,
    { logger, run: jobRun },
  ) => {
    const db = getDb();

    const context = await gatherContext(db, { playbookId, teamId });

    logger.info("playbook_run_start", {
      playbookId,
      teamId,
      runId: jobRun.id,
      triggerSource,
    });

    const run = await createPlaybookRun(db, {
      playbookId,
      teamId,
      triggeredBy,
      triggerSource,
      metadata: metadata ?? null,
    });

    await recordPlaybookRunEvent(db, {
      runId: run.id,
      eventType: "run.created",
      detail: {
        triggerSource,
        triggeredBy,
      },
    });

    const runningRun = (await updatePlaybookRunStatus(db, {
      runId: run.id,
      status: "running",
    })) ?? {
      ...run,
      status: "running",
    };

    await recordPlaybookRunEvent(db, {
      runId: runningRun.id,
      eventType: "run.started",
      detail: {
        triggerSource,
        triggeredBy,
      },
    });

    try {
      if (context.playbook.summary.status === "draft") {
        await updatePlaybookStatus(db, {
          playbookId,
          teamId,
          status: "active",
        });
      }

      await branchContent(db, { run: runningRun, context });
      await finalizeRun(db, { run: runningRun, context });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await recordPlaybookRunEvent(db, {
        runId: run.id,
        eventType: "run.failed",
        detail: {
          message,
        },
      });
      await updatePlaybookRunStatus(db, {
        runId: run.id,
        status: "failed",
        metadata: {
          ...(metadata ?? {}),
          error: message,
        },
      });
      logger.error("playbook_run_failed", {
        playbookId,
        teamId,
        runId: jobRun.id,
        message,
      });
      throw error;
    }
  },
});
