"use server";

import { fetchRecentPipelineActivity } from "@/utils/pipeline";
import { authActionClient } from "../safe-action";
import {
  type PipelineActivityInput,
  pipelineActivityInputSchema,
} from "../schemas/pipeline";
import { ensureAdmin } from "../utils/ensure-admin";

const DEFAULT_LIMIT = 25;

export const getPipelineActivityAction = authActionClient
  .schema(pipelineActivityInputSchema)
  .metadata({
    name: "get-pipeline-activity",
  })
  .action(async ({ parsedInput, ctx: { supabase } }) => {
    await ensureAdmin(supabase);

    const input: PipelineActivityInput = parsedInput ?? {};
    const limit = input.limit ?? DEFAULT_LIMIT;

    const activity = await fetchRecentPipelineActivity(limit);

    return {
      ok: true,
      raw_items: activity.rawItems,
      contents: activity.contents,
      stories: activity.stories,
      ts: new Date().toISOString(),
    } as const;
  });
