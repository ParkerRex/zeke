"use server";

import { revalidatePath } from "next/cache";

import { authActionClient } from "@/actions/safe-action";
import { z } from "zod";

const schema = z.object({
  templateId: z.string(),
  type: z.string(),
  subscriberId: z.string(),
  teamId: z.string(),
  enabled: z.boolean(),
  revalidatePath: z.string().optional(),
});

export const updateSubscriberPreferenceAction = authActionClient
  .schema(schema)
  .metadata({ name: "update-subscriber-preference" })
  .action(async ({ parsedInput }) => {
    if (parsedInput.revalidatePath) {
      revalidatePath(parsedInput.revalidatePath);
    }

    return {
      success: true,
      enabled: parsedInput.enabled,
    } as const;
  });
