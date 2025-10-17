"use server";

import { acceptTeamInvite } from "@zeke/db/queries";
import { connectDb } from "@zeke/db/client";
import { getSession } from "@zeke/supabase/cached-queries";
import { revalidatePath, revalidateTag } from "next/cache";
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
      id: inviteId,
      userId: user.id,
      email,
    });

    revalidateTag(`invites_${user.id}`);
    revalidateTag(`teams_${user.id}`);
    revalidateTag(`user_${user.id}`);
    revalidatePath("/teams");

    return result;
  });
