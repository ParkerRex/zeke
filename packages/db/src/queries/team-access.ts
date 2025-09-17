import { and, eq } from "drizzle-orm";
import type { Database } from "../client";
import { teamInvites, teamMembers, teams, users } from "../schema";

export type GetTeamsForUserParams = {
	userId: string;
};

export type TeamForUser = {
	id: string;
	name: string | null;
	logoUrl: string | null;
	role: string | null;
};

export async function getTeamsForUser(
	db: Database,
	params: GetTeamsForUserParams,
): Promise<TeamForUser[]> {
	const { userId } = params;

	const result = await db
		.select({
			id: teams.id,
			name: teams.name,
			logoUrl: teams.logoUrl,
			role: teamMembers.role,
		})
		.from(teamMembers)
		.innerJoin(teams, eq(teamMembers.teamId, teams.id))
		.where(eq(teamMembers.userId, userId))
		.orderBy(teams.createdAt);

	return result;
}

export type GetTeamInvitesByEmailParams = {
	email: string;
};

export type TeamInviteWithTeam = {
	id: string;
	email: string;
	team: {
		id: string;
		name: string | null;
		logoUrl: string | null;
	} | null;
};

export async function getTeamInvitesByEmail(
	db: Database,
	params: GetTeamInvitesByEmailParams,
): Promise<TeamInviteWithTeam[]> {
	const { email } = params;

	const rows = await db
		.select({
			id: teamInvites.id,
			email: teamInvites.email,
			teamId: teams.id,
			teamName: teams.name,
			teamLogoUrl: teams.logoUrl,
		})
		.from(teamInvites)
		.innerJoin(teams, eq(teamInvites.teamId, teams.id))
		.where(eq(teamInvites.email, email.toLowerCase()))
		.orderBy(teamInvites.createdAt);

	return rows.map((row) => ({
		id: row.id,
		email: row.email,
		team: {
			id: row.teamId,
			name: row.teamName,
			logoUrl: row.teamLogoUrl,
		},
	}));
}

export type GetUserByIdParams = {
	userId: string;
};

export type UserProfile = {
	id: string;
	email: string | null;
	fullName: string | null;
	avatarUrl: string | null;
};

export async function getUserById(
	db: Database,
	params: GetUserByIdParams,
): Promise<UserProfile | null> {
	const { userId } = params;

	const [row] = await db
		.select({
			id: users.id,
			email: users.email,
			fullName: users.fullName,
			avatarUrl: users.avatarUrl,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	return row ?? null;
}

export type GetTeamMembershipParams = {
	userId: string;
	teamId: string;
};

export async function getTeamMembership(
	db: Database,
	params: GetTeamMembershipParams,
) {
	const { userId, teamId } = params;

	const [row] = await db
		.select({ id: teamMembers.id })
		.from(teamMembers)
		.where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
		.limit(1);

	return row ?? null;
}
