export { auth } from "./config";
export { authClient } from "./client/browser";
export { getSession, getUser } from "./client/server";
export { validateSession } from "./client/middleware";
export type { Session, User } from "./types";
