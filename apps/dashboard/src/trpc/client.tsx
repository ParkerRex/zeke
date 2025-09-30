"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";
import { createClient } from "@zeke/supabase/client";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

const { TRPCProvider: InternalTRPCProvider, useTRPC } =
  createTRPCContext<AppRouter>();

// Export both api and useTRPC for compatibility
export { useTRPC as api };
export { useTRPC };
export const TRPCProvider = InternalTRPCProvider;

let browserQueryClient: QueryClient;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }

  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();

  return browserQueryClient;
}

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
          transformer: superjson,
          async headers() {
            const supabase = createClient();

            const {
              data: { session },
            } = await supabase.auth.getSession();

            return {
              Authorization: `Bearer ${session?.access_token}`,
            };
          },
        }),
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <InternalTRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </InternalTRPCProvider>
    </QueryClientProvider>
  );
}
