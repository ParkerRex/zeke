import type { Database } from "@db/client";
import { teams, users, usersOnTeam } from "@db/schema";
import { teamPermissionsCache } from "@zeke/cache/team-permissions-cache";
import { and, eq } from "drizzle-orm";

export const hasTeamAccess = async (
  db: Database,
  teamId: string,
  userId: string,
): Promise<boolean> => {
  const result = await db
    .select({ teamId: usersOnTeam.teamId })
    .from(usersOnTeam)
    .where(and(eq(usersOnTeam.teamId, teamId), eq(usersOnTeam.userId, userId)))
    .limit(1);

  return result.length > 0;
};
export const getTeamById = async (db: Database, id: string) => {
  const [result] = await db
    .select({
      id: teams.id,
      name: teams.name,
      logoUrl: teams.logoUrl,
      email: teams.email,
      plan: teams.plan,
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
      email: teams.email,
      plan: teams.plan,
    });

  return result;
};

type CreateTeamParams = {
  name: string;
  userId: string;
  email: string;
  countryCode?: string;
  logoUrl?: string;
  switchTeam?: boolean;
};
export const createTeam = async (db: Database, params: CreateTeamParams) => {
  const startTime = Date.now();
  const teamCreationId = `team_creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(
    `[${teamCreationId}] Starting team creation for user ${params.userId}`,
    {
      teamName: params.name,
      email: params.email,
      switchTeam: params.switchTeam,
      timestamp: new Date().toISOString(),
    },
  );

  // Use transaction to ensure atomicity and prevent race conditions
  const teamId = await db.transaction(async (tx) => {
    try {
      // Check if user already has teams to prevent duplicate creation
      const existingTeams = await tx
        .select({ id: teams.id, name: teams.name })
        .from(usersOnTeam)
        .innerJoin(teams, eq(teams.id, usersOnTeam.teamId))
        .where(eq(usersOnTeam.userId, params.userId));

      console.log(
        `[${teamCreationId}] User existing teams count: ${existingTeams.length}`,
        {
          existingTeams: existingTeams.map((t) => ({ id: t.id, name: t.name })),
        },
      );

      // Create the team
      console.log(`[${teamCreationId}] Creating team record`);
      const [newTeam] = await tx
        .insert(teams)
        .values({
          name: params.name,
          logoUrl: params.logoUrl,
          email: params.email,
        })
        .returning({ id: teams.id });

      if (!newTeam?.id) {
        throw new Error("Failed to create team.");
      }

      console.log(
        `[${teamCreationId}] Team created successfully with ID: ${newTeam.id}`,
      );

      // Add user to team membership (atomic with team creation)
      console.log(`[${teamCreationId}] Adding user to team membership`);
      await tx.insert(usersOnTeam).values({
        userId: params.userId,
        teamId: newTeam.id,
        role: "owner",
      });

      // Create system categories for the new team (atomic)
      console.log(`[${teamCreationId}] Creating system categories`);
      // @ts-expect-error - tx is a PgTransaction
      await createSystemCategoriesForTeam(tx, newTeam.id, params.countryCode);

      // Optionally switch user to the new team (atomic)
      if (params.switchTeam) {
        console.log(`[${teamCreationId}] Switching user to new team`);
        await tx
          .update(users)
          .set({ teamId: newTeam.id })
          .where(eq(users.id, params.userId));
      }

      const duration = Date.now() - startTime;
      console.log(
        `[${teamCreationId}] Team creation completed successfully in ${duration}ms`,
        {
          teamId: newTeam.id,
          duration,
        },
      );

      return newTeam.id;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[${teamCreationId}] Team creation failed after ${duration}ms:`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          params: {
            userId: params.userId,
            teamName: params.name,
            countryCode: params.countryCode,
          },
          duration,
        },
      );

      // Re-throw with more specific error messages
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to create team due to an unexpected error.");
    }
  });

  // If team switching was enabled, invalidate the team permissions cache
  if (params.switchTeam) {
    const cacheKey = `user:${params.userId}:team`;
    await teamPermissionsCache.delete(cacheKey);
  }

  return teamId;
};

export async function getTeamMembers(db: Database, teamId: string) {
  const result = await db
    .select({
      id: usersOnTeam.id,
      role: usersOnTeam.role,
      team_id: usersOnTeam.teamId,
      user: {
        id: users.id,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        email: users.email,
      },
    })
    .from(usersOnTeam)
    .innerJoin(users, eq(usersOnTeam.userId, users.id))
    .where(eq(usersOnTeam.teamId, teamId))
    .orderBy(usersOnTeam.createdAt);

  return result.map((item) => ({
    id: item.user.id,
    role: item.role,
    fullName: item.user.fullName,
    avatarUrl: item.user.avatarUrl,
    email: item.user.email,
  }));
}

type LeaveTeamParams = {
  userId: string;
  teamId: string;
};

export async function leaveTeam(db: Database, params: LeaveTeamParams) {
  // First verify the user is actually a member of this team
  const hasAccess = await hasTeamAccess(db, params.teamId, params.userId);
  if (!hasAccess) {
    throw new Error("User is not a member of this team");
  }

  // Set team_id to null for the user
  await db
    .update(users)
    .set({ teamId: null })
    .where(and(eq(users.id, params.userId), eq(users.teamId, params.teamId)));

  // Delete the user from users_on_team and return the deleted row
  const [deleted] = await db
    .delete(usersOnTeam)
    .where(
      and(
        eq(usersOnTeam.teamId, params.teamId),
        eq(usersOnTeam.userId, params.userId),
      ),
    )
    .returning();

  // Invalidate the team permissions cache since teamId was set to null
  const cacheKey = `user:${params.userId}:team`;
  await teamPermissionsCache.delete(cacheKey);

  return deleted;
}

type DeleteTeamParams = {
  teamId: string;
  userId: string;
};

export async function deleteTeam(db: Database, params: DeleteTeamParams) {
  // First verify the user is actually a member of this team
  const hasAccess = await hasTeamAccess(db, params.teamId, params.userId);
  if (!hasAccess) {
    throw new Error("User is not a member of this team");
  }

  const [result] = await db
    .delete(teams)
    .where(eq(teams.id, params.teamId))
    .returning({
      id: teams.id,
    });

  return result;
}

type DeleteTeamMemberParams = {
  userId: string;
  teamId: string;
};

export async function deleteTeamMember(
  db: Database,
  params: DeleteTeamMemberParams,
) {
  // First verify the user is actually a member of this team
  const hasAccess = await hasTeamAccess(db, params.teamId, params.userId);
  if (!hasAccess) {
    throw new Error("User is not a member of this team");
  }

  const [deleted] = await db
    .delete(usersOnTeam)
    .where(
      and(
        eq(usersOnTeam.userId, params.userId),
        eq(usersOnTeam.teamId, params.teamId),
      ),
    )
    .returning();

  return deleted;
}

type UpdateTeamMemberParams = {
  userId: string;
  teamId: string;
  role: "owner" | "member";
};

export async function updateTeamMember(
  db: Database,
  params: UpdateTeamMemberParams,
) {
  const { userId, teamId, role } = params;

  // First verify the user is actually a member of this team
  const hasAccess = await hasTeamAccess(db, teamId, userId);
  if (!hasAccess) {
    throw new Error("User is not a member of this team");
  }

  const [updated] = await db
    .update(usersOnTeam)
    .set({ role })
    .where(and(eq(usersOnTeam.userId, userId), eq(usersOnTeam.teamId, teamId)))
    .returning();

  return updated;
}

type GetAvailablePlansResult = {
  starter: boolean;
  pro: boolean;
};

export async function getAvailablePlans(
  db: Database,
  teamId: string,
): Promise<GetAvailablePlansResult> {
  const [teamMembersCountResult] = await Promise.all([
    db.query.usersOnTeam.findMany({
      where: eq(usersOnTeam.teamId, teamId),
      columns: { id: true },
    }),
  ]);

  const teamMembersCount = teamMembersCountResult.length;

  // Can choose starter if team has 2 or fewer members and 2 or fewer bank connections
  const starter = teamMembersCount <= 2;

  // Can always choose pro plan
  return {
    starter,
    pro: true,
  };
}
