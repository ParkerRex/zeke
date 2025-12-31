import { auth } from "@zeke/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth handles the OAuth callback automatically
export const { GET, POST } = toNextJsHandler(auth);
