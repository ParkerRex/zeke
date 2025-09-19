"use server";

import { fetchPipelineCounts, fetchWorkerStatus } from "@/utils/pipeline";
import { pipelineStatusInputSchema } from "../schemas/pipeline";
import { authActionClient } from "../safe-action";
import { ensureAdmin } from "../utils/ensure-admin";

export const getPipelineStatusAction = authActionClient
  .schema(pipelineStatusInputSchema)
  .metadata({
    name: "get-pipeline-status",
  })
  .action(async ({ ctx: { supabase } }) => {
    await ensureAdmin(supabase);

    const [counts, worker] = await Promise.all([
      fetchPipelineCounts(),
      fetchWorkerStatus(),
    ]);

    return {
      ok: true,
      worker,
      counts: {
        raw_items: counts.rawItems,
        contents: counts.contents,
        stories: counts.stories,
      },
      ts: new Date().toISOString(),
    } as const;
  });
