"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { useTRPC } from "@/trpc/client";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type HighlightsByStory = RouterOutputs["highlight"]["byStory"];
type HighlightEngagementRows = RouterOutputs["highlight"]["engagement"];

export function useHighlightsByStory(storyId: string, options?: { includeGlobal?: boolean }) {
	const trpc = useTRPC();
	return useSuspenseQuery(
		trpc.highlight.byStory.queryOptions({
			storyId,
			includeGlobal: options?.includeGlobal ?? true,
		}),
	);
}

export function useHighlightEngagement(highlightIds: string[]) {
	const trpc = useTRPC();
	return useQuery(
		trpc.highlight.engagement.queryOptions({
			highlightIds,
		}),
		{ enabled: highlightIds.length > 0 },
	);
}

export type HighlightList = HighlightsByStory;
export type HighlightEngagement = HighlightEngagementRows[number];
