import { z } from "zod";

import { getDb } from "@jobs/init";
import { logger, schemaTask } from "@jobs/schema-task";
import { linkSourceToStorySchema } from "@jobs/schema";
import { createStoryQueries } from "@zeke/db/queries";

export const linkSourceToStory = schemaTask({
  id: "link-source-to-story",
  schema: linkSourceToStorySchema,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (
    { sourceId, storyId }: z.infer<typeof linkSourceToStorySchema>,
    { logger, run },
  ) => {
    const db = getDb();
    const storyQueries = createStoryQueries(db);

    await storyQueries.attachPrimarySource(storyId, sourceId);

    logger.info("link_source_to_story", {
      sourceId,
      storyId,
      runId: run.id,
    });
  },
});
