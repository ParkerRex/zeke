``` mermaid
flowchart TD

subgraph Browser["Browser / Client Component"]
  A1["User action → useTRPC() hook<br/>(e.g. trpc.workspace.bootstrap.useQuery())"]
  A2["Hook packages input<br/>reuses QueryClient, waits for response"]
  A1 --> A2
end

subgraph Next["Next.js Server Component"]
  B1["SSR: queryClient.fetchQuery(trpc.workspace.bootstrap.queryOptions())"]
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
  E3["RBAC middleware checks permissions<br/>(requirePermission helper)"]
  E4["Audit logger tracks mutations"]
  E1 --> E2 --> E3 --> E4
end

subgraph Router["Router Procedure Execution"]
  F1["Router resolves procedure<br/>(workspace, stories, insights, pipeline, chats)"]
  F2["Inputs validated via Zod schema<br/>(apps/api/src/schemas/*.ts)"]
  F3["Resolver executes business logic<br/>delegates to @zeke/db/queries"]
  F4["Caching layer (Redis/memory)<br/>reduces database load"]
  F1 --> F2 --> F3 --> F4
end

subgraph Response["Response Propagation"]
  G1["Result serialized (superjson)<br/>sent back in HTTP batch"]
  G2["TRPC client deserializes,<br/>updates TanStack Query cache"]
  G3["Hook / server fetch resolves<br/>typed data → UI rerenders"]
  G4["Mutations follow same loop:<br/>client → TRPC → resolver → DB → invalidate/refetch"]
  G1 --> G2 --> G3 --> G4
end

subgraph Streaming["REST Streaming (Chat)"]
  H1["POST /api/chat request"]
  H2["streamText with tool registry"]
  H3["SSE chunks to client"]
  H4["Message persistence to DB"]
  H1 --> H2 --> H3 --> H4
end

Browser --> Next --> TRPCClient --> API --> Middleware --> Router --> Response
Browser --> Streaming

style Middleware fill:#f9f,stroke:#333,stroke-width:2px
style Router fill:#9ff,stroke:#333,stroke-width:2px
style Streaming fill:#ff9,stroke:#333,stroke-width:2px
```