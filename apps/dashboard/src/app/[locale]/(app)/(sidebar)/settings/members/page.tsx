import type { Metadata } from "next";
import { TeamMembers } from "@/components/team-members";
import { prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Members | Zeke",
};

export default function Members() {
	prefetch(trpc.team.members.queryOptions());
	prefetch(trpc.team.teamInvites.queryOptions());

	return <TeamMembers />;
}
