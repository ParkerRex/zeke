"use client";

import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { ReactNode } from "react";
import { useState } from "react";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";

export const trpc = createTRPCReact<AppRouter>();

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60_000,
				suspense: false,
				retry: 1,
				refetchOnWindowFocus: false,
			},
		},
	});
}

function createTRPCClient() {
	return trpc.createClient({
		transformer: superjson,
		links: [
			httpBatchLink({
				url: `${DEFAULT_API_URL.replace(/\/$/, "")}/trpc`,
				fetch: (input, init) =>
					fetch(input, {
						...init,
						credentials: "include",
					}),
			}),
		],
	});
}

export function TRPCProvider({ children }: { children: ReactNode }) {
	const [queryClient] = useState(createQueryClient);
	const [client] = useState(createTRPCClient);

	return (
		<trpc.Provider client={client} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}

export function useTRPC() {
	return trpc;
}

export function useTRPCUtils() {
	return trpc.useUtils();
}
