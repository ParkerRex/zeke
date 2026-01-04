# Auth Package

Authentication wiring. If you need sessions or OAuth, start here. This does not define product rules.

## Owns

- Better Auth configuration
- Session creation/validation
- OAuth and 2FA settings

## Does Not Own

- User profiles (API + DB own them)
- UI flows (Dashboard owns them)
- Billing or permissions logic (API owns it)

## Overview

| Property | Value |
|----------|-------|
| Package | `@zeke/auth` |
| Library | Better Auth |
| Method | Session-based |

## Exports

```typescript
import { auth } from "@zeke/auth/server";
import { authClient } from "@zeke/auth/client";
import { authMiddleware } from "@zeke/auth/middleware";
```

| Export | Description |
|--------|-------------|
| `./server` | Server-side auth |
| `./client` | Browser client |
| `./middleware` | Auth middleware |
| `./admin` | Admin operations |
| `./types` | Type definitions |

## Server Usage

```typescript
import { auth } from "@zeke/auth/server";

// Get session
const session = await auth.api.getSession({
  headers: request.headers,
});

// Verify user
if (!session?.user) {
  throw new Error("Unauthorized");
}
```

## Client Usage

```typescript
import { authClient } from "@zeke/auth/client";

// Sign in
await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});

// Sign out
await authClient.signOut();

// Get session
const session = await authClient.getSession();
```

## OAuth Providers

### Google

```bash
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### GitHub

```bash
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

### Apple

```bash
APPLE_CLIENT_ID=xxx
APPLE_CLIENT_SECRET=xxx
APPLE_TEAM_ID=xxx
APPLE_KEY_ID=xxx
```

## Middleware

### API Protection

```typescript
import { authMiddleware } from "@zeke/auth/middleware";

app.use(authMiddleware);

// Access session in routes
app.get("/protected", async (c) => {
  const session = c.get("session");
  return c.json({ user: session.user });
});
```

### Next.js Middleware

```typescript
// middleware.ts
import { auth } from "@zeke/auth/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.redirect("/login");
  }
}
```

## Two-Factor Authentication

Better Auth includes TOTP-based 2FA:

```typescript
// packages/auth/src/config.ts
import { twoFactor } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: "zekehq.com",
      otpOptions: {
        digits: 6,
        period: 30,
      },
    }),
  ],
});
```

### Client Usage

```typescript
import { authClient } from "@zeke/auth/client";

// Enable 2FA
const { data } = await authClient.twoFactor.enable();
// Returns QR code URL for authenticator app

// Verify 2FA code
await authClient.twoFactor.verifyTotp({
  code: "123456",
});

// Disable 2FA
await authClient.twoFactor.disable({
  password: "user-password",
});
```

## Session Management

Sessions are stored in the database:

```typescript
// Session table (managed by Better Auth)
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at"),
  // ...
});
```

## Configuration

```typescript
// packages/auth/src/server.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: db,
  session: {
    expiresIn: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 24,      // 1 day
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```
