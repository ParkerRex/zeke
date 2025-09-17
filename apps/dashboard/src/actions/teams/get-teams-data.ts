"use server";

import "server-only";

import { connectDb } from "@zeke/db/src/client";
import {
  getTeamInvitesByEmail,
  getTeamsForUser,
  getUserById,
} from "@zeke/db/src/queries";
import { getSession, getUser } from "@zeke/supabase/queries/cached-queries";

export const getTeamsViewData = async () => {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const session = await getSession();
  const email = session.data.session?.user?.email ?? user.email ?? undefined;

  const db = await connectDb();

  const [teams, invites, profile] = await Promise.all([
    getTeamsForUser(db, { userId: user.id }),
    email ? getTeamInvitesByEmail(db, { email }) : Promise.resolve([]),
    getUserById(db, { userId: user.id }),
  ]);

  return {
    user: {
      id: user.id,
      fullName: profile?.fullName ?? user.full_name ?? null,
      email: email ?? null,
    },
    teams,
    invites,
  } as const;
};
