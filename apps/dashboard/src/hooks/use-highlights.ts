"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type HighlightsByStory = RouterOutputs["highlight"]["byStory"];
type HighlightEngagementRows = RouterOutputs["highlight"]["engagement"];

export function useHighlightsByStory(
  storyId: string,
  options?: { includeGlobal?: boolean },
) {
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

export function usePrioritizedHighlights(limit = 20) {
  const trpc = useTRPC();
  return useQuery(
    trpc.highlight.prioritized.queryOptions({
      limit,
    }),
  );
}

export function useHighlightsByKind(
  kind: "insight" | "quote" | "action" | "question" | "code_example" | "code_change" | "api_change" | "metric",
  minRelevance = 0.7,
  limit = 10,
) {
  const trpc = useTRPC();
  return useQuery(
    trpc.highlight.byKind.queryOptions({
      kind,
      minRelevance,
      limit,
    }),
  );
}

export type HighlightList = HighlightsByStory;
export type HighlightEngagement = HighlightEngagementRows[number];
