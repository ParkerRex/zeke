import type { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { updateStoryStatusSchema } from "@jobs/schema";
import { createStoryQueries } from "@zeke/db/queries";

export const updateStoryStatus = schemaTask({
  id: "story-update-status",
  schema: updateStoryStatusSchema,
  queue: {
    concurrencyLimit: 8,
  },
  run: async (
    { storyId, teamId, state }: z.infer<typeof updateStoryStatusSchema>,
    { logger, run },
  ) => {
    const db = getDb();
    const storyQueries = createStoryQueries(db);

    const targetTeams = teamId
      ? [teamId]
      : await storyQueries.getTeamsForStory(storyId);

    if (!targetTeams.length) {
      logger.info("story_status_no_teams", {
        storyId,
        state,
        runId: run.id,
      });
      return;
    }

    await Promise.all(
      targetTeams.map(async (targetTeamId) =>
        storyQueries.upsertTeamStoryState({
          storyId,
          teamId: targetTeamId,
          state,
        }),
      ),
    );

    logger.info("story_status_updated", {
      storyId,
      state,
      runId: run.id,
      teamCount: targetTeams.length,
    });
  },
});
