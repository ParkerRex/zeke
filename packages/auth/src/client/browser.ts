import { createAuthClient } from "better-auth/react";
import { twoFactorClient, oAuthProxyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  plugins: [twoFactorClient(), oAuthProxyClient()],
});

export const { signIn, signUp, signOut, useSession, getSession, twoFactor } =
  authClient;

// Helper for backward compatibility
export const createClient = () => authClient;
