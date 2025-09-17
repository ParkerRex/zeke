"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDb } from "@zeke/db/src/client";
import { declineTeamInvite } from "@zeke/db/src/mutations";
import { getSession } from "@zeke/supabase/queries/cached-queries";
import { authActionClient } from "../safe-action";
import { respondTeamInviteSchema } from "../schema";

export const declineTeamInviteAction = authActionClient
  .schema(respondTeamInviteSchema)
  .metadata({
    name: "decline-team-invite",
  })
  .action(async ({ parsedInput: { inviteId }, ctx: { user } }) => {
    const session = await getSession();
    const email = session.data.session?.user?.email;

    if (!email) {
      throw new Error("No email associated with current session");
    }

    const db = await connectDb();
    const result = await declineTeamInvite(db, {
      inviteId,
      email,
    });

    revalidateTag(`invites_${user.id}`);
    revalidatePath("/teams");

    return result;
  });
