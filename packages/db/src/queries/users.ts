import type { Database } from "@db/client";
import { teamMembers, teams, users } from "@db/schema";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

export const getUserById = async (db: Database, id: string) => {
  const [result] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      weekStartsOnMonday: users.weekStartsOnMonday,
      timezone: users.timezone,
      timezoneAutoSync: users.timezoneAutoSync,
      timeFormat: users.timeFormat,
      dateFormat: users.dateFormat,
      teamId: users.teamId,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      team: {
        id: teams.id,
        name: teams.name,
        plan: teams.plan,
      },
    })
    .from(users)
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(eq(users.id, id));

  return result;
};

export type UpdateUserParams = {
  id: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  locale?: string | null;
  weekStartsOnMonday?: boolean | null;
  timezone?: string | null;
  timezoneAutoSync?: boolean | null;
  timeFormat?: number | null;
  dateFormat?: string | null;
};

export const updateUser = async (db: Database, data: UpdateUserParams) => {
  const { id, ...updateData } = data;

  const [result] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
      locale: users.locale,
      weekStartsOnMonday: users.weekStartsOnMonday,
      timezone: users.timezone,
      timezoneAutoSync: users.timezoneAutoSync,
      timeFormat: users.timeFormat,
      dateFormat: users.dateFormat,
      teamId: users.teamId,
    });

  return result;
};

export const getUserTeamId = async (db: Database, userId: string) => {
  const result = await db.query.users.findFirst({
    columns: { teamId: true },
    where: eq(users.id, userId),
  });

  return result?.teamId || null;
};

export const deleteUser = async (db: Database, id: string) => {
  const teamsWithUser = await db
    .select({
      teamId: teamMembers.teamId,
      memberCount: sql<number>`count(${teamMembers.userId})`.as("member_count"),
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, id))
    .groupBy(teamMembers.teamId);

  const teamIdsToDelete = teamsWithUser
    .filter((team) => team.memberCount === 1)
    .map((team) => team.teamId);

  await Promise.all([
    db.delete(users).where(eq(users.id, id)),
    teamIdsToDelete.length > 0
      ? db.delete(teams).where(inArray(teams.id, teamIdsToDelete))
      : Promise.resolve(),
  ]);

  return { id };
};

type SetActiveTeamParams = {
  userId: string;
  teamId: string;
};

export async function setActiveTeam(db: Database, params: SetActiveTeamParams) {
  const { userId, teamId } = params;

  return db.transaction(async (tx) => {
    const membership = await tx
      .select({ status: teamMembers.status })
      .from(teamMembers)
      .where(
        and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
      )
      .limit(1);

    if (!membership.length) {
      throw new Error("User does not have access to this team");
    }

    await tx
      .update(teamMembers)
      .set({ status: "inactive" })
      .where(
        and(eq(teamMembers.userId, userId), ne(teamMembers.teamId, teamId)),
      );

    await tx
      .update(teamMembers)
      .set({ status: "active", joinedAt: sql`now()` })
      .where(
        and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
      );

    await tx
      .update(users)
      .set({ teamId, updatedAt: sql`now()` })
      .where(eq(users.id, userId));

    return { userId, teamId };
  });
}
