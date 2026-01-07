"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";
import { authClient } from "@zeke/auth/client";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

// Create the TRPC React client with hooks (v10-style direct access pattern)
export const api = createTRPCReact<AppRouter>();

// Legacy exports for compatibility
export const trpc = api;
export const useTRPC = api;

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
    api.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
          transformer: superjson,
          async headers() {
            const session = await authClient.getSession();

            return {
              Authorization: session?.data?.session
                ? `Bearer ${session.data.session.token}`
                : "",
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
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
