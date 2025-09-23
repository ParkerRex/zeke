import { logger, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { getDb } from "@jobs/init";
import { linkSourceToStorySchema } from "@jobs/schema";
import { createStoryQueries } from "@zeke/db/queries";

export const linkSourceToStory = schemaTask({
	id: "link-source-to-story",
	schema: linkSourceToStorySchema,
	queue: {
		concurrencyLimit: 5,
	},
	run: async ({ sourceId, storyId }: z.infer<typeof linkSourceToStorySchema>, { ctx }) => {
		const db = getDb();
		const storyQueries = createStoryQueries(db);

		await storyQueries.attachPrimarySource(storyId, sourceId);

		logger.info("link_source_to_story", {
			sourceId,
			storyId,
			runId: ctx.run.id,
		});
	},
});
