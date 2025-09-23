import { logger } from "@trigger.dev/sdk";

import type { Database } from "@zeke/db/client";
import type { PlaybookDetail, PlaybookRunRecord } from "@zeke/db/queries";
import {
  recordPlaybookRunEvent,
  updatePlaybookRunStatus,
  updatePlaybookStatus,
} from "@zeke/db/queries";

export async function finalizeRun(
  db: Database,
  params: { run: PlaybookRunRecord; context: { playbook: PlaybookDetail } },
): Promise<void> {
  const {
    run,
    context: { playbook },
  } = params;

  await updatePlaybookRunStatus(db, {
    runId: run.id,
    status: "succeeded",
  });

  if (playbook.summary.status === "draft") {
    await updatePlaybookStatus(db, {
      playbookId: playbook.summary.id,
      teamId: playbook.summary.teamId,
      status: "active",
    });
  }

  await recordPlaybookRunEvent(db, {
    runId: run.id,
    eventType: "run.completed",
    detail: {
      playbookId: playbook.summary.id,
      stepCount: playbook.steps.length,
    },
  });

  logger.info("playbook_run_completed", {
    runId: run.id,
    playbookId: playbook.summary.id,
    teamId: playbook.summary.teamId,
  });
}
