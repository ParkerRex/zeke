"use client";

import { useTRPC } from "@/trpc/client";
import type { RouterInputs, RouterOutputs } from "@zeke/api/trpc/routers/_app";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

type User = RouterOutputs["user"]["me"];
type UpdateUserInput = RouterInputs["user"]["update"];

export function useUserQuery() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.user.me.queryOptions());
}

export function useUserMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.user.update.mutationOptions(),
    onMutate: async (newData: UpdateUserInput) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: trpc.user.me.queryKey(),
      });

      // Get current data
      const previousData = queryClient.getQueryData<User>(
        trpc.user.me.queryKey(),
      );

      // Optimistically update
      queryClient.setQueryData<User>(
        trpc.user.me.queryKey(),
        (old: User | undefined) => (old ? { ...old, ...newData } : old),
      );

      return { previousData };
    },
    onError: (
      _error: unknown,
      _variables: UpdateUserInput,
      context: { previousData: User | undefined } | undefined,
    ) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(trpc.user.me.queryKey(), context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({
        queryKey: trpc.user.me.queryKey(),
      });
    },
  });
}
