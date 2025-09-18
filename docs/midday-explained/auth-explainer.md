# Authentication & Authorization Explainer
> Repository: midday  
> Generated: 2025-09-16T22:24:20Z  
> Analyzer: Codex GPT-5 (CLI)  
> Coverage: server | client | jobs | infra | tests

## 0. Method
- Search queries:
  - "rg \"supabase\""
  - "rg \"signInWithOAuth\""
- Tools used: shell (rg, nl, sed, ls)
- Limitations: Reviewed committed source only; library defaults (e.g. Supabase cookie flags, next-safe-action CSRF internals) are inferred from usage because no repo-level overrides exist.

## 1. Identity & Session Model
### 1.1 Identity Sources
- Type: DB | OAuth | Email OTP
- Providers:
  - Name: Supabase Auth (Postgres `auth.users`)
    - Issuer/discovery: `SUPABASE_URL` in API env template [apps/api/.env-template:5-7]
    - Client ID/secret: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` [apps/dashboard/.env-example:2-8]
    - Referenced at:
      - `packages/db/src/schema.ts:2186` (mirrors `auth.users` metadata)
      - `packages/supabase/src/client/server.ts:39` (server client bootstrap)
  - Name: Google OAuth
    - Issuer/discovery: Supabase-managed Google provider (triggered via client SDK) [apps/dashboard/src/components/google-sign-in.tsx:26-53]
    - Client ID/secret: Managed inside Supabase project; not stored in repo (unknown)
    - Referenced at:
      - `apps/dashboard/src/components/google-sign-in.tsx:20-54`
      - `apps/dashboard/src/app/api/auth/callback/route.ts:30-65`
  - Name: GitHub OAuth
    - Issuer/discovery: Supabase GitHub provider [apps/dashboard/src/components/github-sign-in.tsx:26-49]
    - Client ID/secret: Managed in Supabase (unknown)
    - Referenced at: `apps/dashboard/src/components/github-sign-in.tsx:20-49`
  - Name: Apple OAuth
    - Issuer/discovery: Supabase Apple provider [apps/dashboard/src/components/apple-sign-in.tsx:23-38]
    - Client ID/secret: Managed outside repo (unknown)
    - Referenced at: `apps/dashboard/src/components/apple-sign-in.tsx:17-38`
  - Name: Email OTP (Supabase magic link)
    - Issuer/discovery: Supabase OTP endpoint via client SDK [apps/dashboard/src/components/otp-sign-in.tsx:47-58]
    - Client ID/secret: Uses Supabase anon key [apps/dashboard/.env-example:2-6]
    - Referenced at: `apps/dashboard/src/components/otp-sign-in.tsx:47-63`, `apps/dashboard/src/actions/verify-otp-action.ts:22-41`

### 1.2 Sessions & Tokens
- Mechanism: Supabase-issued JWT session tokens verified server-side [apps/api/src/utils/auth.ts:20-42]
- Persistence: Supabase SSR client stores session in HTTP cookies via Next `cookies()` API [packages/supabase/src/client/server.ts:55-78]; server contexts reuse tokens from Authorization headers [apps/api/src/trpc/init.ts:26-37]
- Rotation: Supabase handles refresh on login/exchange (`exchangeCodeForSession`) [apps/dashboard/src/app/api/auth/callback/route.ts:30-33]; admin clients disable auto-refresh (persist=false) [packages/supabase/src/client/server.ts:47-52]
- Token details (if JWT):
  - alg: HMAC (Supabase JWT secret passed to `jwtVerify`) [apps/api/src/utils/auth.ts:25-28]
  - claims: `sub` (user id), `user_metadata.email`, `user_metadata.full_name` [apps/api/src/utils/auth.ts:31-38]
- Referenced at:
  - `apps/api/src/utils/auth.ts:20-42`
  - `apps/dashboard/src/trpc/server.tsx:25-40`
  - `apps/dashboard/src/trpc/client.tsx:41-53`

### 1.3 Cookies
- Cookies set:  
  | Name | Path | Domain | HttpOnly | Secure | SameSite | Max-Age/Expires | Persistence (cookie/db/cache) | Purpose | Set In (file:lines) |
  |------|------|--------|----------|--------|----------|------------------|-------------------------------|---------|---------------------|
  | `preferred-signin-provider` | default (`/`) | default | not specified (Next default) | not specified | not specified | +1 year [apps/dashboard/src/app/api/auth/callback/route.ts:24-27] | cookie | Remember last IdP/OTP choice [apps/dashboard/src/app/api/auth/callback/route.ts:24-27] |
  | `preferred-signin-provider` | default | default | not specified | not specified | not specified | +1 year [apps/dashboard/src/actions/verify-otp-action.ts:37-39] | cookie | Record OTP preference after verification [apps/dashboard/src/actions/verify-otp-action.ts:37-39] |
  | `mfa-setup-visited` | default | default | not specified | not specified | not specified | +1 year [apps/dashboard/src/app/api/auth/callback/route.ts:68-73] | cookie | Gate MFA onboarding redirect [apps/dashboard/src/app/api/auth/callback/route.ts:68-74] |
  | `tracking-consent` | default | default | not specified | not specified | not specified | +1 year [apps/dashboard/src/actions/tracking-consent-action.ts:12-16] | cookie | Persist analytics consent (affects auth UI) [apps/dashboard/src/actions/tracking-consent-action.ts:12-18] |
  | Supabase auth cookies (library-managed) | managed by `@supabase/ssr` | managed | managed | managed | managed | managed | cookie | Persist Supabase session & refresh tokens via `createServerClient` [packages/supabase/src/client/server.ts:55-78; packages/supabase/src/client/middleware.ts:4-28] |
- CSRF strategy: Delegated to `next-safe-action` wrappers (built-in protection, no custom config) [apps/dashboard/src/actions/safe-action.ts:11-40]
- References: `apps/dashboard/src/utils/constants.ts:1-12`

## 2. Authentication Flows
### 2.1 Supabase OAuth Login
- Initiation endpoint: Client invokes `supabase.auth.signInWithOAuth` from login UI [apps/dashboard/src/components/google-sign-in.tsx:26-53]
- Callback handler: Next route `/api/auth/callback` processes codes, analytics, and redirects [apps/dashboard/src/app/api/auth/callback/route.ts:11-80]
- Middleware chain: `updateSession` → locale middleware → session/MFA guard [apps/dashboard/src/middleware.ts:12-88]
- Error handling: Redirects invite flows, empty teams, or MFA setup based on session state [apps/dashboard/src/app/api/auth/callback/route.ts:51-74]
- Data persistence: Supabase cookies + user/team rows (`users_on_team`) checked post-login [apps/dashboard/src/app/api/auth/callback/route.ts:57-64]
- Diagram:
  ```mermaid
  sequenceDiagram
    participant B as Browser
    participant D as Dashboard (Next middleware)
    participant S as Supabase Auth
    B->>S: signInWithOAuth(provider)
    S-->>B: 302 /api/auth/callback?code=...
    B->>D: GET /api/auth/callback
    D->>S: exchangeCodeForSession(code)
    S-->>D: JWT session + refresh cookie
    D->>S: verify team membership (users_on_team)
    D-->>B: Redirect (dashboard | setup | teams)
  ```

### 2.2 Email OTP Login
- Initiation endpoint: Client calls `supabase.auth.signInWithOtp({ email })` [apps/dashboard/src/components/otp-sign-in.tsx:47-51]
- Callback handler: Server action `verifyOtpAction` confirms session and sets preference cookie [apps/dashboard/src/actions/verify-otp-action.ts:19-41]
- Middleware chain: Same Next middleware as OAuth (session redirect + MFA gating) [apps/dashboard/src/middleware.ts:32-88]
- Error handling: Server action throws if session missing post-OTP [apps/dashboard/src/actions/verify-otp-action.ts:33-35]
- Data persistence: Supabase session cookies plus `preferred-signin-provider=otp` [apps/dashboard/src/actions/verify-otp-action.ts:37-39]
- Diagram:
  ```mermaid
  sequenceDiagram
    participant B as Browser
    participant S as Supabase Auth
    participant SA as Server Action
    B->>S: signInWithOtp(email)
    S-->>B: Magic link email
    B->>SA: POST verifyOtp(token,email)
    SA->>S: verifyOtp(token)
    S-->>SA: Session
    SA->>B: redirect(return_to)
  ```

### 2.3 Midday OAuth for API Clients
- Initiation endpoint: `GET /oauth/authorize` serves consent data [apps/api/src/rest/routers/oauth.ts:50-136]
- Callback handler: `POST /oauth/authorize` validates user session via Supabase token and issues authorization codes [apps/api/src/rest/routers/oauth.ts:139-310]
- Middleware chain: `publicMiddleware` (DB) + route-specific rate limiter (15 requests/15min) [apps/api/src/rest/middleware/index.ts:11-18; apps/api/src/rest/routers/oauth.ts:38-47]
- Error handling: PKCE enforcement, redirect with error params, email notifications wrapped in try/catch [apps/api/src/rest/routers/oauth.ts:223-310]
- Data persistence: Authorization codes/tokens stored in `oauth_authorization_codes` and `oauth_access_tokens` tables [packages/db/src/queries/oauth-flow.ts:43-130; packages/db/src/schema.ts:2447-2528]
- Diagram:
  ```mermaid
  sequenceDiagram
    participant App as Third-party App
    participant User as Browser
    participant API as Midday API
    participant DB as Postgres
    App->>User: Redirect to /oauth/authorize
    User->>API: GET /oauth/authorize
    API->>DB: Fetch client + scopes
    API-->>User: Consent payload
    User->>API: POST /oauth/authorize (allow)
    API->>DB: createAuthorizationCode
    API-->>User: redirect_uri?code=...
    App->>API: POST /oauth/token (code)
    API->>DB: exchangeAuthorizationCode
    API-->>App: access_token + refresh_token
  ```

### 2.4 API Key Access (Server-to-server)
- Initiation endpoint: TRPC mutation `apiKeys.upsert` hashes/generates keys [apps/api/src/trpc/routers/api-keys.ts:18-56]
- Callback handler: Consumers send `Authorization: Bearer mid_...` to REST/TRPC endpoints [apps/api/src/rest/middleware/auth.ts:16-118]
- Middleware chain: `withDatabase` → `withAuth` (API key or OAuth token) → `rateLimiter` → `withPrimaryReadAfterWrite` [apps/api/src/rest/middleware/index.ts:18-31]
- Error handling: Invalid format, missing cache entries, revoked tokens return 401/403 [apps/api/src/rest/middleware/auth.ts:24-69]
- Data persistence: Keys stored encrypted/hashed in `api_keys` table [packages/db/src/queries/api-keys.ts:62-83]; Redis caches accelerate lookups [packages/cache/src/api-key-cache.ts:4-10]
- Diagram:
  ```mermaid
  sequenceDiagram
    participant Client as API Client
    participant API as Midday REST/TRPC
    participant Redis as Redis Cache
    participant DB as Postgres
    Client->>API: GET /teams (Authorization: Bearer mid_x)
    API->>Redis: get(api-key hash)
    Redis-->>API: miss
    API->>DB: select api_keys by hash
    DB-->>API: key + scopes
    API->>Redis: cache key metadata
    API-->>Client: Response with scoped data
  ```

3. Authorization Model

3.1 Scheme
	• Model: Team-based RBAC (owner/member) combined with scope-based ABAC for tokens [packages/db/src/schema.ts:138; apps/api/src/utils/scopes.ts:1-30]
	• Roles: `owner`, `member` stored on `users_on_team` [packages/db/src/schema.ts:2072-2129]
	• Permissions: API scopes (`transactions.read`, `apis.all`, etc.) [apps/api/src/utils/scopes.ts:1-92]

3.2 Enforcement Points
	• API: `withRequiredScope` middleware checks scope arrays before handlers [apps/api/src/rest/middleware/scope.ts:4-38]
	• Service: TRPC `protectedProcedure` reruns team permission cache and throws on missing sessions [apps/api/src/trpc/init.ts:64-80; apps/api/src/trpc/middleware/team-permission.ts:6-79]
	• DB: Row Level Security policies on `users`, `teams`, `users_on_team`, OAuth tables guard team access [packages/db/src/schema.ts:1618-1673; 1308-1359; 2072-2129; 2447-2528]

3.3 Frontend
	• Guards: Next middleware enforces login/MFA redirects [apps/dashboard/src/middleware.ts:12-88]
	• Feature flags: None detected; `Cookies.HideConnectFlow` etc. exist but not auth-specific [apps/dashboard/src/utils/constants.ts:1-12]

4. Secrets & Key Management
	• Source: `.env` templates specify Supabase, Redis, encryption, and webhook keys [apps/api/.env-template:1-48; apps/dashboard/.env-example:1-82]
	• Rotation: Not defined in repo (operator responsibility); API revoke endpoints exist for OAuth tokens [apps/api/src/rest/routers/oauth.ts:536-614]
	• References: AES-256-GCM encryption uses `MIDDAY_ENCRYPTION_KEY` [packages/encryption/src/index.ts:7-66]; Supabase service key consumed by server clients [apps/api/src/services/supabase.ts:4-16]

5. Dependencies

| Ecosystem | Package | Version | Purpose | Referenced In |
|-----------|---------|---------|---------|---------------|
| npm | `@supabase/ssr` | ^0.7.0 | SSR client for session cookies | packages/supabase/package.json:12-19 |
| npm | `@supabase/supabase-js` | ^2.56.0 | Supabase administrative/data clients | packages/supabase/package.json:21-22 |
| npm | `jose` | ^6.0.11 | JWT verification for Supabase tokens | apps/api/package.json:44 |
| npm | `hono-rate-limiter` | ^0.4.2 | Rate limiting for REST/OAuth routes | apps/api/package.json:43 |
| npm | `redis` | ^5.8.2 | Backing store for auth/session caches | packages/cache/package.json:15-16 |
| npm | `next-safe-action` | ^7.10.8 | Safe server actions with CSRF protection | apps/dashboard/package.json:56 |

6. Middleware & Entry Points

| Layer | Name | Type | Order | File:Lines | Persistence | Notes |
|-------|------|------|-------|------------|-------------|-------|
| client | Dashboard middleware | Next edge middleware | 1 | apps/dashboard/src/middleware.ts:12-91 | cookie/session | Applies `updateSession`, locale rewrite, login/MFA redirects |
| client | `next-safe-action` wrapper | Server action middleware | 1 | apps/dashboard/src/actions/safe-action.ts:42-82 | Supabase client/context | Injects Supabase client, analytics, and enforces authenticated user |
| server | REST protected stack | Hono middleware array | 1→4 | apps/api/src/rest/middleware/index.ts:18-31 | Redis + DB | `withDatabase` → `withAuth` → rate limiter → replica guard |
| server | TRPC protectedProcedure | tRPC middleware chain | 1→3 | apps/api/src/trpc/init.ts:62-80 | DB/cache | Ensures teamId, session, then runs resolver |
| server | OAuth router limiter | Route-level middleware | 1 | apps/api/src/rest/routers/oauth.ts:38-47 | in-memory counters | Caps repeated authorize/token hits per IP |

7. Persistence & Storage
	• DB tables: `users`, `users_on_team`, `oauth_applications`, `oauth_authorization_codes`, `oauth_access_tokens`, `api_keys`, `auth.users` mirror [packages/db/src/schema.ts:1618-1673; 2072-2129; 2384-2560]
	• Cache usage: Redis-backed caches for team permission and replication lag [packages/cache/src/team-cache.ts:3-9; packages/cache/src/team-permissions-cache.ts:3-9; packages/cache/src/replication-cache.ts:5-15]
	• Cookie-backed state: Auth preference & onboarding cookies set in callback/action handlers [apps/dashboard/src/app/api/auth/callback/route.ts:24-74; apps/dashboard/src/actions/tracking-consent-action.ts:12-18]
	• Migrations: Initial SQL snapshot (commented) defines enums/policies including `teamRoles` and inbox auth data [apps/api/migrations/0000_bumpy_chat.sql:1-120]

8. Client/Frontend
	• Storage method: Relies on Next cookies for auth state; no localStorage usage detected [apps/dashboard/src/utils/constants.ts:1-12]
	• SSR/CSR session fetch: `getSession()` cached per request then passed to TRPC clients [packages/supabase/src/queries/cached-queries.ts:7-10; apps/dashboard/src/trpc/server.tsx:25-40]
	• CSRF/CORS headers: CSRF handled by `next-safe-action` (no extra config) [apps/dashboard/src/actions/safe-action.ts:11-55]; CORS for API defined on Hono server [apps/api/src/index.ts:17-33]

9. Security & Observability
	• Audit logs: Login/MFA events tracked through analytics emitter [apps/dashboard/src/app/api/auth/callback/route.ts:41-49; apps/dashboard/src/actions/mfa-verify-action.ts:17-36; packages/events/src/events.ts:1-129]
	• Rate limits: Global auth middleware limiter (100 req/10 min) and OAuth-specific limiter (20 req/15 min) [apps/api/src/rest/middleware/index.ts:18-29; apps/api/src/rest/routers/oauth.ts:38-47]
	• Headers: API applies `secureHeaders` and curated CORS origins/headers [apps/api/src/index.ts:14-33]
	• MFA/2FA: TOTP enrollment, challenge, and enforcement flows [apps/dashboard/src/components/enroll-mfa.tsx:59-83; apps/dashboard/src/components/verify-mfa.tsx:21-69; apps/dashboard/src/middleware.ts:70-86]

10. Test Coverage
	• Tests: Only unrelated provider fixture tests were found (e.g., Plaid transforms) and no automated coverage targets auth flows [apps/engine/src/providers/plaid/transform.test.ts:24-98]

11. Reverse Index
	• Cookie `preferred-signin-provider`: apps/dashboard/src/app/api/auth/callback/route.ts:24-27; apps/dashboard/src/actions/verify-otp-action.ts:37-39; apps/dashboard/src/app/[locale]/(public)/login/page.tsx:29-104
	• Cookie `mfa-setup-visited`: apps/dashboard/src/app/api/auth/callback/route.ts:68-74; apps/dashboard/src/middleware.ts:70-86
	• Role `teamRolesEnum`: packages/db/src/schema.ts:138; packages/db/src/schema.ts:2072-2129
	• Permission scopes: apps/api/src/utils/scopes.ts:1-92; apps/api/src/rest/middleware/scope.ts:4-38
	• OAuth tokens: packages/db/src/schema.ts:2447-2528; packages/db/src/queries/oauth-flow.ts:43-284

12. Open Questions
	• Supabase-managed cookie attributes (HttpOnly/SameSite/Secure values) are inherited from the SDK and not overridden in this repo—actual runtime values depend on Supabase defaults [packages/supabase/src/client/server.ts:55-78]
	• CSRF handling inside `next-safe-action` is library-defined; no custom configuration observed, so verification of token strategy requires upstream documentation [apps/dashboard/src/actions/safe-action.ts:11-55]
	• OAuth client secrets for third-party providers (Google, GitHub, Apple) are stored outside the repository; rotation and storage practices are unspecified (unknown)
---
