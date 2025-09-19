"use client";

import {
	useMutation,
	useQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useTRPC } from "@/trpc/client";
import type { AppRouter } from "@zeke/api/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;

export type TeamSummary = RouterOutputs["team"]["list"][number];
export type TeamDetail = RouterOutputs["team"]["get"];
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

export function useTeamById(teamId: string) {
	const trpc = useTRPC();
	return useSuspenseQuery(trpc.team.get.queryOptions({ teamId }));
}

export function useSetActiveTeam() {
	const trpc = useTRPC();
	return useMutation(trpc.team.setActive.mutationOptions());
}

export function useTeamInvites() {
	const trpc = useTRPC();
	return useQuery(trpc.team.invites.queryOptions());
}
