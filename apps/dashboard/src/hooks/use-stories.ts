"use client";

import { useTRPC } from "@/trpc/client";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";
import { useMemo } from "react";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type StoryListResponse = RouterOutputs["stories"]["get"];
type StoryListItem = StoryListResponse["stories"][number];
type StoryDetailResult = RouterOutputs["stories"]["getById"];

type StoryKindFilter =
  | "all"
  | "youtube"
  | "arxiv"
  | "podcast"
  | "reddit"
  | "hn"
  | "article";

type UseStoriesListParams = {
  limit?: number;
  offset?: number;
  kind?: StoryKindFilter;
  search?: string;
};

export function useStoriesList(params: UseStoriesListParams) {
  const trpc = useTRPC();
  return useQuery(
    trpc.stories.get.queryOptions({
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      kind: params.kind ?? "all",
      search: params.search,
    }),
  );
}

export function useStoryDetail(storyId: string) {
  const trpc = useTRPC();
  return useSuspenseQuery(
    trpc.stories.getById.queryOptions({
      storyId,
    }),
  );
}

export function useStoryMetrics(storyIds: string[]) {
  const trpc = useTRPC();
  return useQuery(
    trpc.stories.getMetrics.queryOptions({
      storyIds,
    }),
    {
      enabled: storyIds.length > 0,
    },
  );
}

type LegacyStoriesParams = {
  limit?: number;
  kind?: StoryKindFilter;
  q?: string;
};

type LegacyStoriesState = {
  stories: StoryListItem[];
  clusters: StoryListItem[];
  pagination: {
    limit: number;
    offset: number;
    totalCount: number;
    hasMore: boolean;
  } | null;
  loading: boolean;
  isFetchingNext: boolean;
  error: string | null;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
};

export function useStories(
  params: LegacyStoriesParams = {},
): LegacyStoriesState {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const limit = params.limit ?? 20;

  const infiniteQuery = useInfiniteQuery({
    queryKey: [
      "stories.get",
      { kind: params.kind ?? "all", search: params.q ?? null, limit },
    ],
    queryFn: async ({ pageParam = 0 }) => {
      return trpc.stories.get.fetch({
        limit,
        offset: pageParam,
        kind: params.kind ?? "all",
        search: params.q ?? undefined,
      });
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      return lastPage.hasMore ? lastPageParam + limit : undefined;
    },
    initialPageParam: 0,
  });

  const stories = useMemo(
    () => infiniteQuery.data?.pages.flatMap((page) => page.stories) ?? [],
    [infiniteQuery.data?.pages],
  );

  const lastPage = infiniteQuery.data?.pages.at(-1);
  const lastOffset = infiniteQuery.data?.pageParams.at(-1) ?? 0;

  const pagination = lastPage
    ? {
        limit,
        offset: lastOffset,
        totalCount: lastPage.totalCount,
        hasMore: lastPage.hasMore,
      }
    : null;

  const reload = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["stories.get"],
    });
  };

  const loadMore = async () => {
    if (!pagination?.hasMore || infiniteQuery.isFetchingNextPage) {
      return;
    }
    await infiniteQuery.fetchNextPage();
  };

  return {
    stories,
    clusters: stories,
    pagination,
    loading: infiniteQuery.isLoading,
    isFetchingNext: infiniteQuery.isFetchingNextPage,
    error:
      infiniteQuery.error instanceof Error ? infiniteQuery.error.message : null,
    reload,
    loadMore,
  };
}
