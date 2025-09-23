import { logger, schemaTask } from "@trigger.dev/sdk";

import { getDb } from "@jobs/init";
import { attachInsightSchema } from "@jobs/schema";
import { createHighlight, getStoryHighlights } from "@zeke/db/queries";

import { buildInsightKey } from "./helpers";

export const attachInsightToStory = schemaTask({
	id: "insights-attach-to-story",
	schema: attachInsightSchema,
	queue: {
		concurrencyLimit: 3,
	},
	run: async ({ storyId, teamId, createdBy, insight }, { ctx }) => {
		const db = getDb();

		const existingHighlights = await getStoryHighlights(db, {
			storyId,
			teamId,
			includeGlobal: true,
		});

		const incomingKey = buildInsightKey({
			summary: insight.summary,
			quote: insight.quote ?? undefined,
		});

		if (incomingKey) {
			const duplicate = existingHighlights.find((highlight) => {
				const existingKey = buildInsightKey({
					summary: highlight.summary,
					quote: highlight.quote,
				});
				return existingKey !== null && existingKey === incomingKey;
			});

			if (duplicate) {
				logger.info("insights_attach_duplicate", {
					storyId,
					teamId,
					highlightId: duplicate.id,
					dedupeKey: incomingKey,
					runId: ctx.run.id,
				});
				return;
			}
		}

		await createHighlight(db, {
			storyId,
			teamId,
			createdBy,
			title: insight.title ?? null,
			summary: insight.summary,
			quote: insight.quote ?? null,
			tags: insight.tags ?? [],
			origin: insight.origin,
			metadata: {
				...(insight.metadata ?? {}),
				generated: true,
				dedupeKey: incomingKey ?? undefined,
				producer: "trigger.dev",
			},
		});

		logger.info("insights_attach_created", {
			storyId,
			teamId,
			dedupeKey: incomingKey,
			runId: ctx.run.id,
		});
	},
});
