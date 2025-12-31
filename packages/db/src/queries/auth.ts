import type { Database } from "@db/client";
import { authUser } from "@db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a user has admin privileges (system-wide admin, not team admin)
 * @param db Database connection
 * @param userId The user's ID
 * @returns Object with isAdmin boolean and role string
 */
export const getAdminStatus = async (db: Database, userId: string) => {
  const [user] = await db
    .select({
      systemRole: authUser.systemRole,
    })
    .from(authUser)
    .where(eq(authUser.id, userId))
    .limit(1);

  if (!user) {
    return { isAdmin: false, role: null };
  }

  const isAdmin =
    user.systemRole === "admin" || user.systemRole === "super_admin";
  return { isAdmin, role: user.systemRole };
};

/**
 * Check if a user is a super admin (highest privilege level)
 */
export const isSuperAdmin = async (db: Database, userId: string) => {
  const [user] = await db
    .select({
      systemRole: authUser.systemRole,
    })
    .from(authUser)
    .where(eq(authUser.id, userId))
    .limit(1);

  return user?.systemRole === "super_admin";
};

/**
 * Set a user's system role
 * @param db Database connection
 * @param userId The user's ID
 * @param role The role to set: "user", "admin", or "super_admin"
 */
export const setUserSystemRole = async (
  db: Database,
  userId: string,
  role: "user" | "admin" | "super_admin",
) => {
  const [updated] = await db
    .update(authUser)
    .set({ systemRole: role })
    .where(eq(authUser.id, userId))
    .returning({
      id: authUser.id,
      email: authUser.email,
      systemRole: authUser.systemRole,
    });

  return updated;
};

/**
 * Get all admin users
 */
export const getAllAdmins = async (db: Database) => {
  return db
    .select({
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      systemRole: authUser.systemRole,
    })
    .from(authUser)
    .where(eq(authUser.systemRole, "admin"))
    .union(
      db
        .select({
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          systemRole: authUser.systemRole,
        })
        .from(authUser)
        .where(eq(authUser.systemRole, "super_admin")),
    );
};
