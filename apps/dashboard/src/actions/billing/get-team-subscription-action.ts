"use server";

import { fetchTeamActiveSubscription } from "@/utils/billing";
import { ForbiddenError } from "@/utils/errors";
import { authActionClient } from "../safe-action";
import {
  getTeamSubscriptionInputSchema,
  type GetTeamSubscriptionInput,
} from "../schemas/billing";

export const getTeamSubscriptionAction = authActionClient
  .schema(getTeamSubscriptionInputSchema)
  .metadata({
    name: "get-team-subscription",
  })
  .action(async ({ parsedInput, ctx: { user } }) => {
    const input: GetTeamSubscriptionInput = parsedInput ?? {};
    const teamId = input.teamId ?? user.teamId;

    if (!teamId) {
      throw new ForbiddenError("User is not associated with a team");
    }

    const subscription = await fetchTeamActiveSubscription(teamId);
    return subscription;
  });
