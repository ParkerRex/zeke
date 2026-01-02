import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@zeke/db/client";
import * as schema from "@zeke/db/schema";
import { users, teams, usersOnTeam, authUser } from "@zeke/db/schema";

const authSchema = {
  user: schema.authUser,
  session: schema.authSession,
  account: schema.authAccount,
  verification: schema.authVerification,
  twoFactor: schema.authTwoFactor,
};

const getEnvVar = (key: string, required = true): string => {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || "";
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  secret: getEnvVar("AUTH_SECRET"),
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: (process.env.AUTH_TRUSTED_ORIGINS || "")
    .split(",")
    .filter(Boolean),

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // TODO: Integrate with email service (Resend)
      console.log(`Password reset for ${user.email}: ${url}`);
    },
  },

  socialProviders: {
    google: {
      clientId: getEnvVar("GOOGLE_CLIENT_ID", false),
      clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET", false),
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    },
    github: {
      clientId: getEnvVar("GITHUB_CLIENT_ID", false),
      clientSecret: getEnvVar("GITHUB_CLIENT_SECRET", false),
      enabled: Boolean(process.env.GITHUB_CLIENT_ID),
    },
    apple: {
      clientId: getEnvVar("APPLE_CLIENT_ID", false),
      clientSecret: getEnvVar("APPLE_CLIENT_SECRET", false),
      enabled: Boolean(process.env.APPLE_CLIENT_ID),
    },
  },

  plugins: [
    twoFactor({
      issuer: "zekehq.com",
      otpOptions: {
        digits: 6,
        period: 30,
      },
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      teamId: {
        type: "string",
        required: false,
      },
      fullName: {
        type: "string",
        required: false,
      },
      avatarUrl: {
        type: "string",
        required: false,
      },
      locale: {
        type: "string",
        defaultValue: "en",
      },
      timezone: {
        type: "string",
        required: false,
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "apple"],
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Sync user to application users table and create default team
          const teamName = user.name || user.email?.split("@")[0] || "My Team";

          // Create default team for user
          const [team] = await db
            .insert(teams)
            .values({
              name: teamName,
              email: user.email,
            })
            .returning();

          // Create user in application users table with team
          await db.insert(users).values({
            id: user.id,
            email: user.email,
            fullName: user.name,
            avatarUrl: user.image,
            teamId: team.id,
            locale: "en",
          });

          // Add user to team membership
          await db.insert(usersOnTeam).values({
            userId: user.id,
            teamId: team.id,
            role: "owner",
          });

          // Update auth_user with team_id
          await db
            .update(authUser)
            .set({ teamId: team.id })
            .where(eq(authUser.id, user.id));
        },
      },
    },
  },
});

export type Auth = typeof auth;
