import type { Session } from "@api/utils/auth";
import type { Database } from "@zeke/db/client";

// Middleware placeholder that keeps the door open for replica-aware logic.
// For now we only have a primary database, so the handler simply forwards the
// current context unchanged.
export const withPrimaryReadAfterWrite = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    teamId?: string | null;
    db: Database;
  };
  type: "query" | "mutation" | "subscription";
  next: (opts: {
    ctx: {
      session?: Session | null;
      teamId?: string | null;
      db: Database;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;
  return next({ ctx });
};
