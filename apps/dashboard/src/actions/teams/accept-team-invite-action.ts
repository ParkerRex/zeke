"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDb } from "@zeke/db/src/client";
import { acceptTeamInvite } from "@zeke/db/src/mutations";
import { getSession } from "@zeke/supabase/queries/cached-queries";
import { authActionClient } from "../safe-action";
import { respondTeamInviteSchema } from "../schema";

export const acceptTeamInviteAction = authActionClient
  .schema(respondTeamInviteSchema)
  .metadata({
    name: "accept-team-invite",
  })
  .action(async ({ parsedInput: { inviteId }, ctx: { user } }) => {
    const session = await getSession();
    const email = session.data.session?.user?.email;

    if (!email) {
      throw new Error("No email associated with current session");
    }

    const db = await connectDb();
    const result = await acceptTeamInvite(db, {
      inviteId,
      userId: user.id,
      email,
    });

    revalidateTag(`invites_${user.id}`);
    revalidateTag(`teams_${user.id}`);
    revalidateTag(`user_${user.id}`);
    revalidatePath("/teams");

    return result;
  });
