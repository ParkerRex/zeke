import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

/**
 * Workspace router - provides current workspace state for the dashboard
 */
export const workspaceRouter = createTRPCRouter({
  /**
   * Get current workspace - returns all initial data needed for dashboard hydration
   * This reduces multiple API calls on initial page load
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const { db, session } = ctx;
    const userId = session.user.id;
    const teamId = ctx.teamId;

    // Allow bootstrap for users without teams (they'll be redirected to team creation)
    if (!teamId) {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
        with: {
          profile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          locale: user.locale || "en",
          timezone: user.timezone || "UTC",
          preferences: user.profile?.preferences || {},
        },
        team: null,
        navCounts: {
          stories: 0,
          highlights: 0,
          playbooks: 0,
          chats: 0,
          notifications: 0,
        },
        banners: [],
        assistantSummary: {
          recentChatIds: [],
          messageCount30d: 0,
          lastChatDate: null,
          suggestedPrompts: [
            "What are the latest trends in AI research?",
            "Summarize this week's important stories",
            "Help me create a competitive analysis",
          ],
        },
      };
    }

    try {
      // Fetch user data
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
        with: {
          profile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Fetch team data with member count
      const team = await db.query.teams.findFirst({
        where: (teams, { eq }) => eq(teams.id, teamId),
        with: {
          members: {
            limit: 100,
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      // Calculate navigation counts (for badges)
      const [
        unreadStoriesCount,
        activeHighlightsCount,
        pendingPlaybooksCount,
        recentChatsCount,
        unreadNotificationsCount,
      ] = await Promise.all([
        // Count unread stories
        db.query.teamStoryStates
          .findMany({
            where: (states, { and, eq }) =>
              and(eq(states.teamId, teamId), eq(states.state, "unread")),
          })
          .then((results) => results.length),

        // Count active highlights
        db.query.teamHighlightStates
          .findMany({
            where: (states, { and, eq }) =>
              and(eq(states.teamId, teamId), eq(states.state, "active")),
          })
          .then((results) => results.length),

        // Count pending playbooks
        db.query.playbooks
          .findMany({
            where: (playbooks, { and, eq }) =>
              and(eq(playbooks.teamId, teamId), eq(playbooks.status, "draft")),
          })
          .then((results) => results.length),

        // Count recent chats (last 7 days)
        db.query.chats
          .findMany({
            where: (chats, { and, eq, gte }) =>
              and(
                eq(chats.teamId, teamId),
                gte(
                  chats.updatedAt,
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ),
              ),
          })
          .then((results) => results.length),

        // Count unread notifications
        db.query.notifications
          .findMany({
            where: (notifications, { and, eq }) =>
              and(
                eq(notifications.teamId, teamId),
                eq(notifications.userId, userId),
                eq(notifications.read, false),
              ),
          })
          .then((results) => results.length)
          .catch(() => 0),
      ]);

      // Fetch any active banners/notifications
      const banners = await getBanners(db, teamId);

      // Get assistant usage summary
      const assistantSummary = await getAssistantSummary(db, teamId, userId);

      // Get subscription details for trial status
      const subscription = await db.query.subscriptions.findFirst({
        where: (subs, { eq }) => eq(subs.teamId, teamId),
      });

      let trialDaysLeft = null;
      let subscriptionStatus = subscription?.status || "inactive";

      if (subscriptionStatus === "trialing" && subscription?.trialEndsAt) {
        trialDaysLeft = Math.max(
          0,
          Math.ceil(
            (new Date(subscription.trialEndsAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        );
      }

      // Return bootstrap payload
      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          locale: user.locale || "en",
          timezone: user.timezone || "UTC",
          preferences: user.profile?.preferences || {},
        },
        team: {
          id: team.id,
          name: team.name,
          slug: team.slug, // Now exists in schema
          plan: team.plan, // Use 'plan' field from schema
          memberCount: team.members.length,
          isOwner: team.ownerId === userId, // Now works with ownerId column
          subscriptionStatus,
          trialDaysLeft,
        },
        navCounts: {
          stories: unreadStoriesCount,
          highlights: activeHighlightsCount,
          playbooks: pendingPlaybooksCount,
          chats: recentChatsCount,
          notifications: unreadNotificationsCount,
        },
        banners,
        assistantSummary,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch workspace data",
      });
    }
  }),
});

/**
 * Get active banners for the team
 */
async function getBanners(db: any, teamId: string) {
  const banners = [];

  // Check for trial expiration
  const subscription = await db.query.subscriptions.findFirst({
    where: (subs, { and, eq }) =>
      and(eq(subs.teamId, teamId), eq(subs.status, "trialing")),
  });

  if (subscription?.trialEndsAt) {
    const daysLeft = Math.ceil(
      (new Date(subscription.trialEndsAt).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysLeft <= 7 && daysLeft > 0) {
      banners.push({
        id: "trial-expiring",
        type: "warning",
        message: `Your trial expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        action: {
          label: "Upgrade Now",
          href: "/settings/billing",
        },
      });
    }
  }

  // Check for ingestion issues
  const failedSources = await db.query.sourceHealth.findMany({
    where: (health, { eq }) => eq(health.status, "error"),
    limit: 1,
  });

  if (failedSources.length > 0) {
    banners.push({
      id: "ingestion-errors",
      type: "error",
      message: "Some data sources are experiencing issues",
      action: {
        label: "View Status",
        href: "/settings/sources",
      },
    });
  }

  return banners;
}

/**
 * Get assistant usage summary for the user
 */
async function getAssistantSummary(db: any, teamId: string, userId: string) {
  // Get recent chat activity
  const recentChats = await db.query.chats.findMany({
    where: (chats, { and, eq, gte }) =>
      and(
        eq(chats.teamId, teamId),
        eq(chats.userId, userId),
        gte(chats.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days
      ),
    orderBy: (chats, { desc }) => [desc(chats.updatedAt)],
    limit: 5,
  });

  // Count total messages in last 30 days
  const messageCount = await db.query.chatMessages
    .findMany({
      where: (messages, { and, eq, gte }) =>
        and(
          eq(messages.teamId, teamId),
          eq(messages.userId, userId),
          gte(
            messages.createdAt,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ),
        ),
    })
    .then((results) => results.length);

  return {
    recentChatIds: recentChats.map((chat) => chat.id),
    messageCount30d: messageCount,
    lastChatDate: recentChats[0]?.updatedAt || null,
    suggestedPrompts: [
      "What are the latest trends in AI research?",
      "Summarize this week's important stories",
      "Help me create a competitive analysis",
    ],
  };
}
