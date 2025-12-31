import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { db } from "@zeke/db/client";

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
});

export type Auth = typeof auth;
