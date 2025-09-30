import { TRPCError } from "@trpc/server";
import type { ApiContext } from "@api/context";
import { createClient } from "@zeke/db/client";
import * as schema from "@zeke/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Role-Based Access Control (RBAC) middleware for TRPC
 * Enforces permissions based on user roles within teams
 */

export type Permission =
  | "read:stories"
  | "write:stories"
  | "delete:stories"
  | "read:insights"
  | "write:insights"
  | "delete:insights"
  | "read:chats"
  | "write:chats"
  | "delete:chats"
  | "manage:team"
  | "manage:billing"
  | "manage:sources"
  | "execute:playbooks"
  | "export:data";

export type Role = "owner" | "admin" | "member" | "viewer";

// Permission matrix - which roles have which permissions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    // Owners have all permissions
    "read:stories",
    "write:stories",
    "delete:stories",
    "read:insights",
    "write:insights",
    "delete:insights",
    "read:chats",
    "write:chats",
    "delete:chats",
    "manage:team",
    "manage:billing",
    "manage:sources",
    "execute:playbooks",
    "export:data",
  ],
  admin: [
    // Admins can manage content but not billing/team
    "read:stories",
    "write:stories",
    "delete:stories",
    "read:insights",
    "write:insights",
    "delete:insights",
    "read:chats",
    "write:chats",
    "delete:chats",
    "manage:sources",
    "execute:playbooks",
    "export:data",
  ],
  member: [
    // Members can read/write but not delete or manage
    "read:stories",
    "write:stories",
    "read:insights",
    "write:insights",
    "read:chats",
    "write:chats",
    "execute:playbooks",
    "export:data",
  ],
  viewer: [
    // Viewers can only read
    "read:stories",
    "read:insights",
    "read:chats",
  ],
};

/**
 * Get user's role within a team
 */
async function getUserRole(
  db: any,
  userId: string,
  teamId: string,
): Promise<Role | null> {
  try {
    // Check if user is team owner
    const team = await db.query.teams.findFirst({
      where: and(eq(schema.teams.id, teamId), eq(schema.teams.ownerId, userId)),
    });

    if (team) return "owner";

    // Get user's membership role
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, userId),
      ),
    });

    if (!membership) return null;

    // Map database role to our role type
    switch (membership.role) {
      case "admin":
        return "admin";
      case "member":
        return "member";
      case "viewer":
        return "viewer";
      default:
        return "member"; // Default to member if unknown
    }
  } catch (error) {
    console.error("Failed to get user role:", error);
    return null;
  }
}

/**
 * Check if a role has a specific permission
 */
function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * RBAC middleware factory - creates middleware that checks for specific permissions
 */
export function requirePermission(permission: Permission) {
  return async (opts: {
    ctx: ApiContext & { teamId?: string | null };
    next: any;
  }) => {
    const { ctx, next } = opts;

    // Ensure user is authenticated
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // Ensure team context exists
    if (!ctx.teamId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Team context required",
      });
    }

    // Get user's role
    const role = await getUserRole(ctx.db, ctx.session.user.id, ctx.teamId);

    if (!role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this team",
      });
    }

    // Check permission
    if (!hasPermission(role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required: ${permission}`,
      });
    }

    // Add role to context for downstream use
    const enrichedContext = {
      ...ctx,
      userRole: role,
      permissions: ROLE_PERMISSIONS[role],
    };

    return next({ ctx: enrichedContext });
  };
}

/**
 * Helper to check multiple permissions (OR logic - user needs at least one)
 */
export function requireAnyPermission(permissions: Permission[]) {
  return async (opts: {
    ctx: ApiContext & { teamId?: string | null };
    next: any;
  }) => {
    const { ctx, next } = opts;

    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!ctx.teamId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Team context required",
      });
    }

    const role = await getUserRole(ctx.db, ctx.session.user.id, ctx.teamId);

    if (!role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this team",
      });
    }

    // Check if user has at least one of the required permissions
    const hasRequiredPermission = permissions.some((permission) =>
      hasPermission(role, permission),
    );

    if (!hasRequiredPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required one of: ${permissions.join(", ")}`,
      });
    }

    const enrichedContext = {
      ...ctx,
      userRole: role,
      permissions: ROLE_PERMISSIONS[role],
    };

    return next({ ctx: enrichedContext });
  };
}

/**
 * Export role utilities for use in procedures
 */
export const roleUtils = {
  getUserRole,
  hasPermission,
  ROLE_PERMISSIONS,
};
