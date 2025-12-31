"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;

export type TeamSummary = RouterOutputs["team"]["list"][number];
export type TeamDetail = NonNullable<RouterOutputs["team"]["current"]>;
export type TeamInvite = RouterOutputs["team"]["invites"][number];

export function useTeamsQuery() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.team.list.queryOptions());
}

export function useCurrentTeam() {
  const trpc = useTRPC();
  return useQuery(trpc.team.current.queryOptions(), {
    staleTime: 30_000,
  });
}

// Removed useTeamById - not used, and team.get doesn't exist
// Use useCurrentTeam for the active team
// Removed useSetActiveTeam - use trpc.user.update({ teamId }) instead

export function useTeamInvites() {
  const trpc = useTRPC();
  return useQuery(trpc.team.invites.queryOptions());
}
