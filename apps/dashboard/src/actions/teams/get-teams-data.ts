"use server";

import "server-only";

import { getSession } from "@zeke/auth/server";
import { connectDb } from "@zeke/db/client";
import {
  getTeamInvitesByEmail,
  getTeamsForUser,
  getUserById,
} from "@zeke/db/queries";

export const getTeamsViewData = async () => {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = session.user;
  const email = user.email ?? undefined;

  const db = await connectDb();

  const [teams, invites, profile] = await Promise.all([
    getTeamsForUser(db, { userId: user.id }),
    email ? getTeamInvitesByEmail(db, { email }) : Promise.resolve([]),
    getUserById(db, { userId: user.id }),
  ]);

  return {
    user: {
      id: user.id,
      fullName: profile?.fullName ?? user.name ?? null,
      email: email ?? null,
    },
    teams,
    invites,
  } as const;
};
