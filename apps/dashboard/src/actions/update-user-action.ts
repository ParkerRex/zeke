"use server";

import { revalidateTag } from "next/cache";

import { authActionClient } from "@/actions/safe-action";
import { updateUserSchema } from "@/actions/schema";
import { logger } from "@/utils/logger";
import { updateUser } from "@zeke/db/queries";

export const updateUserAction = authActionClient
  .schema(updateUserSchema)
  .metadata({
    name: "update-user",
  })
  .action(async ({ parsedInput, ctx }) => {
    const payloadEntries = Object.entries(parsedInput).filter(
      ([, value]) => value !== undefined && value !== null,
    );

    if (payloadEntries.length === 0) {
      return { success: true } as const;
    }

    const payload = Object.fromEntries(payloadEntries);

    await updateUser(ctx.db, { id: ctx.user.id, ...payload });

    try {
      revalidateTag("user-profile");
    } catch (error) {
      logger("Failed to revalidate user profile tag", error);
    }

    return { success: true } as const;
  });
