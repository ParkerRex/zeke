import type { Database } from "@db/client";
import { teams, teamMembers, users, usersOnTeam } from "@db/schema";
import { and, eq } from "drizzle-orm";

export const getTeamById = async (db: Database, id: string) => {
  const [result] = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      ownerId: teams.ownerId,
      logoUrl: teams.logoUrl,
      email: teams.email,
      inboxId: teams.inboxId,
      plan: teams.plan,
      countryCode: teams.countryCode,
    })
    .from(teams)
    .where(eq(teams.id, id));

  return result;
};

type UpdateTeamParams = {
  id: string;
  data: Partial<typeof teams.$inferInsert>;
};

export const updateTeamById = async (
  db: Database,
  params: UpdateTeamParams,
) => {
  const { id, data } = params;

  const [result] = await db
    .update(teams)
    .set(data)
    .where(eq(teams.id, id))
    .returning({
      id: teams.id,
      name: teams.name,
      logoUrl: teams.logoUrl,
    });

  return result;
};

export type CreateTeamParams = {
  name: string;
  userId: string;
  email?: string;
  countryCode?: string;
  logoUrl?: string;
  switchTeam?: boolean;
};

export const createTeam = async (db: Database, params: CreateTeamParams) => {
  try {
    // Generate slug from team name (lowercase, replace spaces with hyphens)
    const slug = params.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    const [newTeam] = await db
      .insert(teams)
      .values({
        name: params.name,
        slug: slug,
        ownerId: params.userId, // Set owner
        email: params.email,
        logoUrl: params.logoUrl,
        countryCode: params.countryCode,
      })
      .returning({ id: teams.id });

    if (!newTeam?.id) {
      throw new Error("Failed to create team.");
    }

    // Add user to team membership
    await db.insert(usersOnTeam).values({
      userId: params.userId,
      teamId: newTeam.id,
      role: "owner",
    });

    // Note: System categories removed during migration to Zeke

    // Optionally switch user to the new team
    if (params.switchTeam) {
      await db
        .update(users)
        .set({ teamId: newTeam.id })
        .where(eq(users.id, params.userId));
    }

    return newTeam.id;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create team.");
  }
};

export async function getTeamMembers(db: Database, teamId: string) {
  const result = await db
    .select({
      id: usersOnTeam.id,
      teamId: usersOnTeam.teamId,
      userId: usersOnTeam.userId,
      role: usersOnTeam.role,
      joinedAt: usersOnTeam.joinedAt,
      user: {
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(usersOnTeam)
    .innerJoin(users, eq(usersOnTeam.userId, users.id))
    .where(eq(usersOnTeam.teamId, teamId));

  return result;
}

export async function deleteTeam(db: Database, teamId: string) {
  // First delete all team memberships
  await db.delete(usersOnTeam).where(eq(usersOnTeam.teamId, teamId));

  // Then delete the team
  await db.delete(teams).where(eq(teams.id, teamId));

  return { success: true };
}

export async function updateTeamLogo(
  db: Database,
  teamId: string,
  logoUrl: string | null,
) {
  const [result] = await db
    .update(teams)
    .set({ logoUrl })
    .where(eq(teams.id, teamId))
    .returning({ logoUrl: teams.logoUrl });

  return result;
}

export async function leaveTeam(db: Database, userId: string, teamId: string) {
  // Remove user from team by deleting their team membership
  const [removedMember] = await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .returning();

  return removedMember;
}

export async function deleteTeamMember(
  db: Database,
  params: { teamId: string; userId: string },
) {
  const { teamId, userId } = params;

  const [deletedMember] = await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .returning();

  return deletedMember;
}

export async function updateTeamMember(
  db: Database,
  params: { teamId: string; userId: string; role: string },
) {
  const { teamId, userId, role } = params;

  const [updatedMember] = await db
    .update(teamMembers)
    .set({ role: role as "owner" | "member" })
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .returning();

  return updatedMember;
}
