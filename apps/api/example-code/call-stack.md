# User Display Name Update Flow

This document walks through the full data flow when the dashboard updates a user's display name. It follows the `DisplayName` client component end-to-end through TanStack Query, the tRPC client, API handlers, shared schemas, and the database layer. The goal is to make the path readable by humans and tooling alike.

---

## 1. Client Component: `DisplayName`
- **File:** `apps/dashboard/src/components/display-name.tsx`
- **Role:** Presents the "Display Name" form, wires it to hooks, and triggers the mutation on submit.
- **Key points:**
  - Marks itself with `"use client"`, so all logic runs on the browser.
  - Calls `useUserQuery()` to fetch the current user and prefill the form.
  - Calls `useUserMutation()` to send updates.
  - On submit, invokes `updateUserMutation.mutate({ fullName })`.

```tsx
const { data: user } = useUserQuery();
const updateUserMutation = useUserMutation();
...
updateUserMutation.mutate({ fullName: data?.fullName });
```

---

## 2. Dashboard Hooks: `useUserQuery` & `useUserMutation`
- **File:** `apps/dashboard/src/hooks/use-user.ts`
- **Role:** App-specific wrappers that marry the tRPC client to TanStack Query for caching and optimistic updates.

### `useUserQuery`
- Grabs the tRPC client via `useTRPC()` (provided higher in the component tree).
- Passes `trpc.user.me.queryOptions()` into `useSuspenseQuery` so the dashboard can rely on React suspense.
- Result: Any caller gets a strongly typed `{ data: user }` object, populated via tRPC.

### `useUserMutation`
- Wraps `trpc.user.update.mutationOptions()` inside TanStack Query's `useMutation`.
- Implements optimistic updates: temporarily patches the cached `user.me` query before the server confirms.
- Cleans up:
  - `onError` restores the previous cache snapshot.
  - `onSettled` invalidates the query so fresh data is fetched.
- Benefit: Uniform mutation behavior across components without repeating cache logic.

---

## 3. tRPC Context in the Dashboard

### Provider setup
- **File:** `apps/dashboard/src/trpc/client.tsx`
- **Exports:** `{ TRPCProvider, useTRPC }` and the `TRPCReactProvider` component.
- **Responsibilities:**
  1. Construct a TanStack `QueryClient` via `getQueryClient()` and `makeQueryClient()` (`apps/dashboard/src/trpc/query-client.ts`).
     - Configures serialization/deserialization with `superjson` so complex types survive hydration across server/client boundaries.
     - Sets a default `staleTime` and custom dehydration strategy.
  2. Create a browser-side tRPC client with `createTRPCClient<AppRouter>()` and the `httpBatchLink`:
     - Batches parallel procedure calls into fewer HTTP requests.
     - Points at `${NEXT_PUBLIC_API_URL}/trpc`.
     - Uses `superjson` as the data transformer to keep dates, maps, etc. intact.
     - Injects an `Authorization: Bearer <token>` header by calling the Supabase browser client (`@midday/supabase/client`).
       *Supabase handles session storage; the dashboard simply reuses the access token so the tRPC API trusts the user.*
  3. Wraps the React tree in both `QueryClientProvider` and `TRPCProvider`, wiring TanStack Query and the tRPC hooks together.

### Why `@midday/supabase` exists
- Browser code calls `packages/supabase/src/client/client.ts` to get a Supabase browser client configured with project env vars.
- Server code (e.g., API routes) can call `packages/supabase/src/client/server.ts` to create service or anon clients with cookie handling.
- This package centralizes Supabase setup so both the dashboard and the API reuse the same auth utilities.

---

## 4. Crossing the Network: tRPC Request

When `useUserMutation().mutate()` runs:
1. The tRPC client serializes `{ fullName: "..." }` with `superjson`.
2. `httpBatchLink` POSTs the payload to `${NEXT_PUBLIC_API_URL}/trpc/user.update`.
3. The Supabase-derived bearer token travels in the headers.
4. The response (success or error) is deserialized back into strongly typed data.

Because the tRPC client and server share the same router types (`AppRouter`), the dashboard code is type-safe end-to-end. Any shape drift in the server procedure or schema surfaces instantly at build time.

---

## 5. API Entry Point: tRPC Router
- **File:** `apps/api/src/trpc/routers/user.ts`
- **Procedure:** `user.update`
- **Pipeline:**
  1. `protectedProcedure` verifies the token, injects the session and permitted `teamId`, and ensures the request hits a writable replica.
     - Implementation in `apps/api/src/trpc/init.ts` uses `verifyAccessToken`, `createClient` (Supabase server client), and Drizzle DB connection pooling.
  2. Input is validated with `updateUserSchema` (`apps/api/src/schemas/users.ts`).
  3. Calls `updateUser(db, { id: session.user.id, ...input })` from the shared DB package.
  4. Returns the updated row, allowing the client cache to reconcile with the database.

Benefits:
- Strong validation keeps only supported fields (fullName, locale, formats, etc.) mutable.
- Session-based `id` guards against users overwriting other accounts.
- Reuse of DB query utilities avoids duplicating SQL across interfaces.

---

## 6. Database Write: Shared Query Layer
- **File:** `packages/db/src/queries/users.ts`
- **Function:** `updateUser(db, data)`
- **Behavior:**
  - Deconstructs `id` and builds a Drizzle `update` statement against the `users` table.
  - Returns a consistent subset of user columns for reuse across consumers (tRPC or REST).

Because this module only requires a `Database` instance, any runtime (API, scripts, workers) can reuse it. Drizzle generates the SQL while preserving TypeScript inference for the returned row.

---

## 7. REST Counterpart (For Other Clients)
- **File:** `apps/api/src/rest/routers/users.ts`
- **Why it exists:** Non-React clients (mobile apps, integrations) use a conventional REST+OpenAPI surface instead of tRPC.
- **Details:**
  - Uses the same `updateUserSchema` and `userSchema` for request and response validation, keeping constraints identical across transport layers.
  - Exposes `/api/users/me` endpoints via Hono with scoped middleware (`users.read`, `users.write`).
  - Calls the *same* `updateUser` database helper, so persistence logic stays centralized.
  - `validateResponse` ensures the payload matches `userSchema` before leaving the server, producing reliable OpenAPI docs.

---

## 8. Schema Sharing
- **Source of truth:** `apps/api/src/schemas/users.ts`
- **Usage:**
  - Imported by the tRPC router for input validation.
  - Imported by the REST router for both validation and OpenAPI generation.
- **Benefits:**
  - Ensures both transport layers accept and emit identical shapes.
  - Allows documentation tooling (Swagger/Speakeasy) to pull accurate types.
  - Prevents silent drift between mobile/desktop/web clients.

---

## 9. Putting It Together (Sequence Diagram)

```text
DisplayName component (client)
  └─ useUserMutation() [TanStack hook]
       └─ trpc.user.update.mutate() [typed mutation]
            └─ tRPC client httpBatchLink
                 └─ HTTPS POST /trpc/user.update with Supabase bearer token
                      └─ tRPC server protectedProcedure
                           ├─ verifyAccessToken & create Supabase server client
                           ├─ validate input with updateUserSchema
                           └─ updateUser(db, { id, ...fields })
                                 └─ Drizzle SQL against users table
                      └─ Return updated user row → superjson encode
                 └─ superjson decode → TanStack mutation resolves
       └─ TanStack invalidates user.me query → refetch via useUserQuery()
            └─ trpc.user.me.queryOptions() fetches latest DB state
```

---

## 10. Key Advantages
- **Type safety end-to-end:** Type definitions flow from the database query up through the API router to the React hooks. Compile-time errors highlight breaking changes immediately.
- **Single source of validation truth:** `updateUserSchema` and `userSchema` gate every entry point.
- **Caching & UX:** TanStack Query handles optimistic updates, cache invalidation, and suspense so client components stay simple.
- **Auth consistency:** Supabase client utilities centralize access token handling for both the dashboard and API.
- **Transport flexibility:** tRPC for the React dashboard, REST/OpenAPI for other consumers—both backed by the same logic and schemas.
```
