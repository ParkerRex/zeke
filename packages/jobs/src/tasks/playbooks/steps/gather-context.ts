import type { Database } from "@zeke/db/client";
import type { PlaybookDetail } from "@zeke/db/queries";
import { getPlaybookById } from "@zeke/db/queries";

export type PlaybookRunContext = {
  playbook: PlaybookDetail;
};

export async function gatherContext(
  db: Database,
  params: { playbookId: string; teamId: string },
): Promise<PlaybookRunContext> {
  const detail = await getPlaybookById(db, {
    playbookId: params.playbookId,
    teamId: params.teamId,
  });

  if (!detail) {
    throw new Error(
      `Playbook ${params.playbookId} not found for team ${params.teamId}`,
    );
  }

  return { playbook: detail };
}
