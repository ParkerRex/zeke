"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDb } from "@zeke/db/src/client";
import { setActiveTeam } from "@zeke/db/src/mutations";
import { authActionClient } from "../safe-action";
import { setActiveTeamSchema } from "../schema";

export const setActiveTeamAction = authActionClient
  .schema(setActiveTeamSchema)
  .metadata({
    name: "set-active-team",
  })
  .action(async ({ parsedInput: { teamId }, ctx: { user } }) => {
    const db = await connectDb();
    const result = await setActiveTeam(db, { userId: user.id, teamId });

    revalidateTag(`user_${user.id}`);
    revalidateTag(`teams_${user.id}`);
    revalidatePath("/teams");

    return result;
  });
