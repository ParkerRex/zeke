``` mermaid
flowchart TD

subgraph Browser["Browser / Client Component"]
  A1["User action → useTRPC() hook<br/>(e.g. trpc.team.list.useQuery())"]
  A2["Hook packages input<br/>reuses QueryClient, waits for response"]
  A1 --> A2
end

subgraph Next["Next.js Server Component"]
  B1["SSR: queryClient.fetchQuery(trpc.team.list.queryOptions())"]
  B2["Options come from same router<br/>(server + client share config)"]
  B3["Result hydrates into <HydrateClient><br/>so client reuses cached data"]
  B1 --> B2 --> B3
end

subgraph TRPCClient["TRPC Client Instance"]
  C1["createTRPCClient<AppRouter>()<br/>(apps/dashboard/src/trpc/client.tsx)"]
  C2["httpBatchLink → ${NEXT_PUBLIC_API_URL}/trpc"]
  C3["Adds headers (Supabase Auth, locale, timezone)"]
  C1 --> C2 --> C3
end

subgraph API["API Route Handler"]
  D1["Hono / Next API receives batched TRPC POST on /trpc"]
  D2["Dispatches to appRouter (apps/api/src/trpc/routers/_app.ts)"]
  D1 --> D2
end

subgraph Middleware["TRPC Middleware Stack"]
  E1["createTRPCContext builds ctx<br/>(session, db, geo info)"]
  E2["protectedProcedure enforces auth,<br/>injects teamId, ensures DB read"]
  E3["withTeamPermission verifies team access"]
  E1 --> E2 --> E3
end

subgraph Router["Router Procedure Execution"]
  F1["Router looks up e.g. team.list"]
  F2["Inputs validated via Zod schema<br/>(apps/api/src/schemas/team.ts)"]
  F3["Resolver runs (apps/api/src/trpc/routers/team.ts)<br/>delegates to @zeke/db/queries"]
  F1 --> F2 --> F3
end

subgraph Response["Response Propagation"]
  G1["Result serialized (superjson)<br/>sent back in HTTP batch"]
  G2["TRPC client deserializes,<br/>updates TanStack Query cache"]
  G3["Hook / server fetch resolves<br/>typed data → UI rerenders"]
  G4["Mutations follow same loop:<br/>client → TRPC → resolver → DB → invalidate/refetch"]
  G1 --> G2 --> G3 --> G4
end

Browser --> Next --> TRPCClient --> API --> Middleware --> Router --> Response
```