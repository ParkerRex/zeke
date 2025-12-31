"use server";

import { auth } from "@zeke/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

export const unenrollMfaAction = authActionClient
  .schema(
    z.object({
      factorId: z.string(),
    }),
  )
  .metadata({
    name: "unenroll-mfa",
  })
  .action(async ({ ctx: { user } }) => {
    // Disable two-factor authentication using Better Auth
    const result = await auth.api.disableTwoFactor({
      body: {},
      headers: {
        // Use the user's session for authentication
        "x-user-id": user.id,
      },
    });

    revalidatePath("/account/security");

    return result;
  });
