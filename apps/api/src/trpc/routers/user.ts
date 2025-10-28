import { updateUserSchema } from "@api/schemas/users";
import { resend } from "@api/services/resend";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  deleteUser,
  getUserById,
  getUserInvites,
  updateUser,
} from "@zeke/db/queries";
import { logger } from "@zeke/logger";
import type { Database } from "@zeke/db/client";
import { users, teams } from "@zeke/db/schema";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Saga pattern implementation for user deletion with compensating transactions.
 * This ensures data consistency by implementing rollback logic for each step.
 */

type DeletedUserData = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  locale: string | null;
  timeFormat: number | null;
  dateFormat: string | null;
  weekStartsOnMonday: boolean | null;
  timezone: string | null;
  timezoneAutoSync: boolean | null;
  teamId: string | null;
  createdAt: string | null;
};

type DeletedTeamData = {
  id: string;
  name: string | null;
  logoUrl: string | null;
  email: string | null;
  canceledAt: string | null | undefined;
  plan: "trial" | "starter" | "pro";
  createdAt: string | undefined;
};

/**
 * Compensating transaction: Restore user to database after failed deletion
 */
async function rollbackDbUser(
  db: Database,
  userData: DeletedUserData,
  deletedTeams: DeletedTeamData[],
): Promise<void> {
  try {
    logger.info("Rolling back database user deletion", { userId: userData.id });

    // Restore teams first (if any were deleted)
    if (deletedTeams.length > 0) {
      // Map the team data to ensure proper types
      const teamsToRestore = deletedTeams.map((team) => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        email: team.email,
        canceledAt: team.canceledAt ?? null,
        plan: team.plan,
        createdAt: team.createdAt ?? undefined,
      }));
      await db.insert(teams).values(teamsToRestore);
      logger.info("Restored deleted teams", {
        teamIds: deletedTeams.map((t) => t.id),
      });
    }

    // Restore user
    await db.insert(users).values(userData);
    logger.info("Successfully rolled back user deletion", {
      userId: userData.id,
    });
  } catch (error) {
    logger.error("CRITICAL: Failed to rollback database user deletion", {
      userId: userData.id,
      error,
    });
    // This is a critical error - we've lost the ability to restore the user
    throw new Error(
      `Critical error during rollback: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Compensating transaction: Recreate auth user after failed deletion
 */
async function rollbackAuthUser(
  supabase: SupabaseClient,
  email: string,
  userId: string,
): Promise<void> {
  try {
    logger.info("Rolling back auth user deletion", { userId, email });

    // Note: Supabase doesn't provide a direct way to restore a deleted user with the same ID.
    // This is a limitation of the current approach. In production, consider:
    // 1. Using soft deletes in auth
    // 2. Implementing a "deleted users" archive table
    // 3. Using Supabase's user metadata to mark as "pending deletion" instead of actual deletion

    // For now, we log this as a critical error that requires manual intervention
    logger.error(
      "CRITICAL: Cannot fully restore auth user - manual intervention required",
      {
        userId,
        email,
        note: "Supabase auth user cannot be restored with same ID after deletion",
      },
    );

    throw new Error(
      "Auth user rollback not fully supported - manual intervention required",
    );
  } catch (error) {
    logger.error("Failed to rollback auth user deletion", {
      userId,
      email,
      error,
    });
    throw error;
  }
}

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    return getUserById(db, session.user.id);
  }),

  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return updateUser(db, {
        id: session.user.id,
        ...input,
      });
    }),

  delete: protectedProcedure.mutation(
    async ({ ctx: { supabase, db, session } }) => {
      const userId = session.user.id;
      const userEmail = session.user.email!;

      logger.info("Starting user deletion saga", { userId, email: userEmail });

      // Step 1: Capture user data before deletion (for potential rollback)
      const userDataSnapshot = await getUserById(db, userId);
      if (!userDataSnapshot) {
        logger.error("User not found for deletion", { userId });
        throw new Error("User not found");
      }

      // Capture teams that will be deleted (teams with only this user)
      // Use query builder for better type inference
      const teamsWithUser = await db.query.usersOnTeam.findMany({
        where: (usersOnTeam, { eq }) => eq(usersOnTeam.userId, userId),
        columns: {
          teamId: true,
        },
      });

      const teamIdsToDelete: string[] = [];
      const deletedTeamsData: DeletedTeamData[] = [];

      for (const { teamId } of teamsWithUser) {
        const memberCount = await db.query.usersOnTeam.findMany({
          where: (usersOnTeam, { eq }) => eq(usersOnTeam.teamId, teamId),
        });

        if (memberCount.length === 1) {
          // This team will be deleted, capture its data
          const teamData = await db.query.teams.findFirst({
            where: (teams, { eq }) => eq(teams.id, teamId),
          });

          if (teamData) {
            teamIdsToDelete.push(teamId);
            deletedTeamsData.push(teamData);
          }
        }
      }

      const userSnapshot: DeletedUserData = {
        id: userDataSnapshot.id,
        fullName: userDataSnapshot.fullName,
        email: userDataSnapshot.email,
        avatarUrl: userDataSnapshot.avatarUrl,
        locale: userDataSnapshot.locale,
        timeFormat: userDataSnapshot.timeFormat,
        dateFormat: userDataSnapshot.dateFormat,
        weekStartsOnMonday: userDataSnapshot.weekStartsOnMonday,
        timezone: userDataSnapshot.timezone,
        timezoneAutoSync: userDataSnapshot.timezoneAutoSync,
        teamId: userDataSnapshot.teamId,
        createdAt: new Date().toISOString(), // Approximate creation time
      };

      logger.info("Captured user snapshot for potential rollback", {
        userId,
        teamsToDelete: teamIdsToDelete,
      });

      // Step 2: Delete from database
      // This is the first step because if it fails, nothing else happens
      let dbDeletionResult: { id: string };
      try {
        logger.info("Step 1: Deleting user from database", { userId });
        dbDeletionResult = await deleteUser(db, userId);
        logger.info("Successfully deleted user from database", { userId });
      } catch (error) {
        logger.error("Failed to delete user from database", { userId, error });
        throw new Error(
          `Database deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Step 3: Delete from Supabase Auth
      // If this fails, we need to rollback the database deletion
      try {
        logger.info("Step 2: Deleting user from Supabase Auth", { userId });
        await supabase.auth.admin.deleteUser(userId);
        logger.info("Successfully deleted user from Supabase Auth", { userId });
      } catch (error) {
        logger.error("Failed to delete user from Supabase Auth - rolling back", {
          userId,
          error,
        });

        // Compensating transaction: Restore database user
        await rollbackDbUser(db, userSnapshot, deletedTeamsData);

        throw new Error(
          `Auth deletion failed, database changes rolled back: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      // Step 4: Remove from Resend (optional)
      // If this fails, we need to rollback both auth and database
      if (resend && process.env.RESEND_AUDIENCE_ID) {
        try {
          logger.info("Step 3: Removing user from Resend", {
            userId,
            email: userEmail,
          });
          await resend.contacts.remove({
            email: userEmail,
            audienceId: process.env.RESEND_AUDIENCE_ID,
          });
          logger.info("Successfully removed user from Resend", {
            userId,
            email: userEmail,
          });
        } catch (error) {
          logger.error(
            "Failed to remove user from Resend - rolling back all changes",
            { userId, email: userEmail, error },
          );

          // Compensating transaction: Restore database user first
          await rollbackDbUser(db, userSnapshot, deletedTeamsData);

          // Note: We cannot fully rollback the Supabase auth deletion
          // This is logged as a critical error for manual intervention
          logger.error(
            "CRITICAL: User deleted from auth but not from Resend - manual cleanup required",
            {
              userId,
              email: userEmail,
              action: "Manual intervention required to restore auth user or remove from Resend",
            },
          );

          throw new Error(
            `Resend removal failed, database rolled back but auth deletion cannot be reversed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      logger.info("User deletion saga completed successfully", { userId });
      return dbDeletionResult;
    },
  ),

  invites: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    if (!session.user.email) {
      return [];
    }

    return getUserInvites(db, session.user.email);
  }),
});
