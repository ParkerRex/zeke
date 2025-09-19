import {
  teamDetailSchema,
  teamIdInputSchema,
  teamInvitesSchema,
  teamListResponseSchema,
  teamSetActiveInputSchema,
} from "@api/schemas/team";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getTeamInvitesByEmail,
  getTeamSummaryById,
  getTeamsForUser,
} from "@zeke/db/queries";
import { setActiveTeam } from "@zeke/db/queries";
import { TRPCError } from "@trpc/server";
import { z } from "@hono/zod-openapi";

export const teamRouter = createTRPCRouter({
  list: protectedProcedure
    .output(teamListResponseSchema)
    .query(async ({ ctx: { db, session } }) => {
      const teams = await getTeamsForUser(db, { userId: session.user.id });

      return teams.map((team) => ({
        id: team.id,
        name: team.name ?? "Untitled Team",
        slug: team.slug ?? null,
        logoUrl: team.logoUrl ?? null,
        planCode: team.planCode ?? null,
      }));
    }),

  current: protectedProcedure
    .output(teamDetailSchema.nullable())
    .query(async ({ ctx: { db, teamId } }) => {
      if (!teamId) {
        return null;
      }

      const team = await getTeamSummaryById(db, teamId);

      if (!team) {
        return null;
      }

      return {
        id: team.id,
        name: team.name,
        slug: team.slug,
        logoUrl: team.logoUrl,
        planCode: team.planCode,
        metadata: (team.metadata ?? null) as Record<string, unknown> | null,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      };
    }),

  setActive: protectedProcedure
    .input(teamSetActiveInputSchema)
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx: { db, session }, input }) => {
      await setActiveTeam(db, {
        userId: session.user.id,
        teamId: input.teamId,
      });

      return { success: true } as const;
    }),

  get: protectedProcedure
    .input(teamIdInputSchema)
    .output(teamDetailSchema)
    .query(async ({ ctx: { db, session }, input }) => {
      const memberships = await getTeamsForUser(db, {
        userId: session.user.id,
      });

      const hasAccess = memberships.some((team) => team.id === input.teamId);
      if (!hasAccess) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No team access" });
      }

      const team = await getTeamSummaryById(db, input.teamId);
      if (!team) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Team not found" });
      }

      return {
        id: team.id,
        name: team.name,
        slug: team.slug,
        logoUrl: team.logoUrl,
        planCode: team.planCode,
        metadata: (team.metadata ?? null) as Record<string, unknown> | null,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      };
    }),

  invites: protectedProcedure
    .output(z.array(teamInvitesSchema))
    .query(async ({ ctx: { db, session } }) => {
      if (!session.user.email) {
        return [];
      }

      const invites = await getTeamInvitesByEmail(db, {
        email: session.user.email,
      });

      return invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        role: invite.role ?? "member",
        status: invite.status ?? "pending",
        expiresAt: invite.expiresAt,
        team: invite.team
          ? {
              id: invite.team.id,
              name: invite.team.name,
              slug: invite.team.slug,
              logoUrl: invite.team.logoUrl,
              planCode: invite.team.planCode,
            }
          : null,
      }));
    }),
});
