"use server";

import { Cookies } from "@/utils/constants";
import { auth } from "@zeke/auth";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionClient } from "./safe-action";

export const verifyOtpAction = actionClient
  .schema(
    z.object({
      token: z.string(),
      email: z.string(),
      redirectTo: z.string(),
    }),
  )
  .action(async ({ parsedInput: { email, token, redirectTo } }) => {
    // Verify the magic link token with Better Auth
    const result = await auth.api.verifyMagicLink({
      body: { token },
    });

    if (!result) {
      throw new Error("Failed to verify OTP");
    }

    (await cookies()).set(Cookies.PreferredSignInProvider, "otp", {
      expires: addYears(new Date(), 1),
    });

    redirect(redirectTo);
  });
