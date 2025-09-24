"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useTRPC } from "@/trpc/client";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;

type ThreadContextInput = RouterInputs["assistant"]["getOrCreateThread"];
type MessagesInput = RouterInputs["assistant"]["listMessages"];
type ThreadSourcesInput = RouterInputs["assistant"]["listThreadSources"];
type AssistantMessageInput = RouterInputs["assistant"]["createMessage"];
type AddSourceInput = RouterInputs["assistant"]["addThreadSource"];
type RemoveSourceInput = RouterInputs["assistant"]["removeThreadSource"];
type LinkSourcesInput = RouterInputs["assistant"]["linkMessageSources"];

export function useAssistantThread() {
  const trpc = useTRPC();
  return useMutation(trpc.assistant.getOrCreateThread.mutationOptions());
}

export function useAssistantMessages(params: MessagesInput) {
  const trpc = useTRPC();
  return useInfiniteQuery({
    queryKey: ["assistant.listMessages", params],
    queryFn: async ({ pageParam }) => {
      return trpc.assistant.listMessages.fetch!({
        ...params,
        before: pageParam,
      });
    },
    initialPageParam: params.before ?? null,
    getNextPageParam: (lastPage) =>
      lastPage.length > 0
        ? (lastPage[lastPage.length - 1]?.createdAt ?? null)
        : undefined,
  });
}

export function useAssistantThreadSources(params: ThreadSourcesInput) {
  const trpc = useTRPC();
  return useSuspenseQuery(
    trpc.assistant.listThreadSources.queryOptions(params),
  );
}

export function useCreateAssistantMessage() {
  const trpc = useTRPC();
  return useMutation(trpc.assistant.createMessage.mutationOptions());
}

export function useAddAssistantSource() {
  const trpc = useTRPC();
  return useMutation(trpc.assistant.addThreadSource.mutationOptions());
}

export function useRemoveAssistantSource() {
  const trpc = useTRPC();
  return useMutation(trpc.assistant.removeThreadSource.mutationOptions());
}

export function useLinkAssistantMessageSources() {
  const trpc = useTRPC();
  return useMutation(trpc.assistant.linkMessageSources.mutationOptions());
}

export type AssistantThread = RouterOutputs["assistant"]["getOrCreateThread"];
export type AssistantMessagePages = RouterOutputs["assistant"]["listMessages"];
