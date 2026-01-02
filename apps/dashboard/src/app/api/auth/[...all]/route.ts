import { auth } from "@zeke/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Handle all Better Auth routes (sign-in, callbacks, session, etc.)
export const { GET, POST } = toNextJsHandler(auth);
