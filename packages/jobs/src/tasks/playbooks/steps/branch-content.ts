import { logger } from "@jobs/schema-task";

import type { Database } from "@zeke/db/client";
import type { PlaybookDetail, PlaybookRunRecord } from "@zeke/db/queries";
import { recordPlaybookRunEvent, upsertPlaybookStep } from "@zeke/db/queries";

export async function branchContent(
  db: Database,
  params: { run: PlaybookRunRecord; context: { playbook: PlaybookDetail } },
): Promise<void> {
  const {
    context: { playbook },
    run,
  } = params;
  const steps = [...playbook.steps].sort((a, b) => a.position - b.position);

  for (const step of steps) {
    await recordPlaybookRunEvent(db, {
      runId: run.id,
      stepId: step.id ?? null,
      eventType: "step.started",
      detail: {
        title: step.templateStep?.title ?? step.id,
        position: step.position,
      },
    });

    if (step.id) {
      await upsertPlaybookStep(db, {
        playbookId: playbook.summary.id,
        stepId: step.id,
        status: "in_progress",
      });
    }

    // Placeholder for future branching logic. At this stage we simply
    // mark each step as completed to ensure the workflow advances.
    if (step.id) {
      await upsertPlaybookStep(db, {
        playbookId: playbook.summary.id,
        stepId: step.id,
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    }

    await recordPlaybookRunEvent(db, {
      runId: run.id,
      stepId: step.id ?? null,
      eventType: "step.completed",
      detail: {
        title: step.templateStep?.title ?? step.id,
        position: step.position,
      },
    });

    logger.info("playbook_step_completed", {
      playbookId: playbook.summary.id,
      stepId: step.id,
      runId: run.id,
      position: step.position,
    });
  }
}
