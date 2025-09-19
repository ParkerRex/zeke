### 0. Ground Rules

  1. No new direct connectDb() usage outside apps/api once the API surface exists.
  2. Every data need must have a TRPC procedure (and optional REST counterpart).
  3. React Query is the default client-side state layer; server components prefetch
  via TRPC helpers.
  4. Engine (engine) interactions go through @zeke/engine-client when we land it.

  ———

  ### 1. Triage the Call Site

  - Server component/page/layout (async in /app/...): go to Server Components
  section.
  - Client component ("use client" at top): go to Client Components.
  - Server Action ("use server" or safe-action) / API route in dashboard: go to
  Server Actions / API Routes.
  - Background job: talk to provider/engine client (after refactor), not in this
  checklist.

  ———

  ### 2. Verify API Capabilities

  Before touching the component:

  1. Find or create TRPC router entry in apps/api/src/trpc/routers.
      - Pattern: routerName.procedureName using publicProcedure / protectedProcedure.
      - For REST parity, add route under apps/api/src/rest/routers.
      - Data source is Drizzle query/mutation (@zeke/db/queries).
  2. Add Zod input/output schemas so both TRPC and REST re-use them.
  3. Write/extend tests (unit for queries + integration hitting the endpoint).
  4. Export types (RouterOutputs, etc.) to feed front-end generics.

  If an endpoint already exists (e.g., after porting zeke), skip to component work.

  ———

  ### 3. Patterns by Consumption Site

  #### A. Server Components (RSC)

  Use the TRPC server helpers and QueryClient prefetch, mirroring zeke:

  1. Import helpers:

  import {
    getQueryClient,
    batchPrefetch,
    trpc,
  } from '@/trpc/server';

  2. In your server component:

  const queryClient = getQueryClient();

  batchPrefetch([
    trpc.pipeline.status.queryOptions(),      // queue prefetches
    trpc.pipeline.recent.queryOptions({ limit: 25 }),
  ]);

  const pipelineStatus = await queryClient.fetchQuery(
    trpc.pipeline.status.queryOptions(),
  );

  3. Return JSX; pass prefetched data down or rely on client hooks (see below).
  4. For Suspense hydration, wrap children in <HydrateClient> (as zeke does).
  5. Remove direct DB imports—only the API should call Drizzle now.

  Decision tip: if the server component only needs data at render time and no client
  interactivity, you can read from pipelineStatus directly. If the child client
  component should manage caching, still prefetch to warm React Query and let the
  hook use the cached data.

  #### B. Client Components ("use client")

  1. Import the TRPC React hook factory:

  import { useTRPC } from '@/trpc/client';

  2. Create a custom hook if the component is reused:

  import { useSuspenseQuery } from '@tanstack/react-query';

  export function usePipelineStatus() {
    const trpc = useTRPC();
    return useSuspenseQuery(trpc.pipeline.status.queryOptions());
  }

  3. Use useMutation for writes, with optimistic updates and invalidations:

  const trpc = useTRPC();
  const mutation = trpc.pipeline.trigger.useMutation({
    onSuccess: () => queryClient.invalidateQueries(trpc.pipeline.status.queryKey()),
  });

  4. Remove any state that was tied to useEffect + fetch; React Query handles cache/
  stale logic.

  Decision tip: if the data is only needed here, calling
  trpc.pipeline.status.useSuspenseQuery() inline is fine—wrap in a custom hook only
  when reused.

  #### C. Server Actions / API Routes (Dashboard)

  1. For actions using next-safe-action, extend the existing authActionClient
  pattern:

  export const triggerIngestAction = authActionClient
    .schema(triggerSchema)
    .metadata({ name: 'trigger-ingest' })
    .action(async ({ ctx: { supabase }, input }) => {
      await ensureAdmin(supabase);
      const client = apiRouter.createCaller({ /* context (session, supabase) */ });
      return client.pipeline.trigger(input);
    });

  2. If not using safe-action, either:
      - Call await fetch('https://api.yourdomain/...') with Authorization header (use
  ENGINE_API_KEY if hitting engine), or
      - Use TRPC caller:

  import { appRouter } from '@zeke/api/appRouter'; // generated type
  const caller = appRouter.createCaller(await createTRPCContext({ /* session */ }));
  await caller.pipeline.trigger({ ... });

  3. Ensure server actions have Supabase session context for auth; mimic zeke’s
  authActionClient pipeline.

  Decision tip: default to TRPC caller because it reuses the same validation/scope
  guard as the API. Use REST only when you need to stream or call without session
  context.

  ———

  ### 4. State Management Guidance

  - React Query is the single source of truth for client-side cache.
  - Global UI state (modals, filters) stays in Zustand/Context as before; only data
  fetching/caching goes through TRPC hooks.
  - Server component data: prefer prefetch + pass data as props; rely on client hook
  for live updates/invalidations when needed.

  ———

  ### 5. When to Update Engine Client

  If the component currently calls the engine (e.g., hitting /debug/ingest):

  1. Replace the call with @zeke/engine-client once it’s available:

  import { engineClient } from '@zeke/engine-client';

  await engineClient.ingestSource({ sourceId });

  2. Ensure the API owns the direct engine client; dashboard should only hit the API.

  ———

  ### 6. Deleting Old Paths

  After migrating a feature:

  - Remove the direct Drizzle helper/export that route used.
  - Drop unused Supabase RPC wrappers (e.g., getAdminFlag).
  - Update README/docs noting the API endpoint is now canonical.
  - Run lint/test to ensure no stray connectDb in dashboard/engine.

  ———

  ### 7. Quick Decision Tree

  Does the component/action read/write data?
      No → leave as-is (UI logic only).
      Yes:
          Is it a server component? → Prefetch via TRPC server helper.
          Is it a client component? → Use trpc.useSuspenseQuery / useMutation.
          Is it a server action/API route? → Use TRPC caller or fetch API with auth.
          Is it calling engine? → Go through @zeke/engine-client (once available).
  Does an API endpoint exist?
      No → create TRPC procedure (+ REST if needed) first.
      Yes → follow the component pattern above.

  ———

  Roll this playbook into the team workflow so everyone follows the same steps. As
  soon as the first feature (pipeline) is migrated, you’ll have a live template to
  mirror for the rest.