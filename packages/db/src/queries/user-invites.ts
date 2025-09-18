import type { Database } from "@db/client";
import { teams, teamInvites, teamMembers, users } from "@db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export async function getUserInvites(db: Database, email: string) {
	const rows = await db
		.select({
			id: teamInvites.id,
			email: teamInvites.email,
			role: teamInvites.role,
			status: teamInvites.status,
			expiresAt: teamInvites.expiresAt,
			team: {
				id: teams.id,
				name: teams.name,
				slug: teams.slug,
			},
		})
		.from(teamInvites)
		.leftJoin(teams, eq(teamInvites.teamId, teams.id))
		.where(eq(teamInvites.email, email));

	return rows.map((row) => ({
		id: row.id,
		email: row.email,
		role: row.role,
		status: row.status,
		expiresAt: row.expiresAt,
		team: row.team,
	}));
}

type AcceptTeamInviteParams = {
	id: string;
	userId: string;
	email: string;
};

export async function acceptTeamInvite(
	db: Database,
	params: AcceptTeamInviteParams,
) {
	const { id, userId, email } = params;

	return db.transaction(async (tx) => {
		const [invite] = await tx
			.select({
				id: teamInvites.id,
				teamId: teamInvites.teamId,
				role: teamInvites.role,
				status: teamInvites.status,
				expiresAt: teamInvites.expiresAt,
			})
			.from(teamInvites)
			.where(and(eq(teamInvites.id, id), eq(teamInvites.email, email)))
			.limit(1);

		if (!invite) {
			throw new Error("Invite not found or already processed");
		}

		if (invite.status !== "pending") {
			throw new Error(`Invite is ${invite.status}`);
		}

		if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
			throw new Error("Invite has expired");
		}

		await tx
			.update(teamMembers)
			.set({ status: "inactive" })
			.where(eq(teamMembers.userId, userId));

		await tx
			.insert(teamMembers)
			.values({
				teamId: invite.teamId,
				userId,
				role: invite.role,
				status: "active",
			})
			.onConflictDoUpdate({
				target: [teamMembers.teamId, teamMembers.userId],
				set: {
					role: invite.role,
					status: "active",
					joinedAt: sql`now()`,
				},
			});

		await tx.delete(teamInvites).where(eq(teamInvites.id, invite.id));

		await tx
			.update(users)
			.set({ teamId: invite.teamId, updatedAt: sql`now()` })
			.where(eq(users.id, userId));

		return {
			teamId: invite.teamId,
			role: invite.role,
		};
	});
}

type DeclineTeamInviteParams = {
	id: string;
	email: string;
};

export async function declineTeamInvite(
	db: Database,
	params: DeclineTeamInviteParams,
) {
	const { id, email } = params;

	return db
		.delete(teamInvites)
		.where(and(eq(teamInvites.id, id), eq(teamInvites.email, email)));
}

export async function getTeamInvites(db: Database, teamId: string) {
	const rows = await db
		.select({
			id: teamInvites.id,
			email: teamInvites.email,
			role: teamInvites.role,
			status: teamInvites.status,
			expiresAt: teamInvites.expiresAt,
			invitedBy: teamInvites.invitedBy,
		})
		.from(teamInvites)
		.where(eq(teamInvites.teamId, teamId));

	return rows.map((row) => ({
		id: row.id,
		email: row.email,
		role: row.role,
		status: row.status,
		expiresAt: row.expiresAt,
		invitedBy: row.invitedBy,
	}));
}

export async function getInvitesByEmail(db: Database, email: string) {
	const rows = await db
		.select({
			id: teamInvites.id,
			email: teamInvites.email,
			role: teamInvites.role,
			status: teamInvites.status,
			expiresAt: teamInvites.expiresAt,
			teamId: teamInvites.teamId,
		})
		.from(teamInvites)
		.where(eq(teamInvites.email, email));

	return rows.map((row) => ({
		id: row.id,
		email: row.email,
		role: row.role,
		status: row.status,
		expiresAt: row.expiresAt,
		teamId: row.teamId,
	}));
}

type CreateTeamInvitesParams = {
	teamId: string;
	invites: {
		email: string;
		role: "owner" | "member";
		invitedBy: string;
	}[];
};

type InviteValidationResult = {
	validInvites: {
		email: string;
		role: "owner" | "member";
		invitedBy: string;
	}[];
	skippedInvites: {
		email: string;
		reason: "already_member" | "already_invited" | "duplicate";
	}[];
};

function buildCaseInsensitiveFilters(
	emails: string[],
	column: AnyPgColumn,
) {
	return emails.map((address) => sql`LOWER(${column}) = ${address}`);
}

async function validateInvites(
	db: Database,
	teamId: string,
	invites: CreateTeamInvitesParams["invites"],
): Promise<InviteValidationResult> {
	const uniqueInvites = invites.filter(
		(invite, index, self) =>
			index ===
			self.findIndex((candidate) =>
				candidate.email.toLowerCase() === invite.email.toLowerCase(),
			),
	);

	const emails = uniqueInvites.map((invite) => invite.email.toLowerCase());

	if (emails.length === 0) {
		return { validInvites: [], skippedInvites: [] };
	}

	const memberFilters = buildCaseInsensitiveFilters(emails, users.email);
	const memberCondition =
		memberFilters.length === 1 ? memberFilters[0] : or(...memberFilters);

	const existingMembers = await db
		.select({ email: users.email })
		.from(teamMembers)
		.innerJoin(users, eq(teamMembers.userId, users.id))
		.where(and(eq(teamMembers.teamId, teamId), memberCondition));

	const existingMemberEmails = new Set(
		existingMembers
			.map((member) => member.email?.toLowerCase())
			.filter(Boolean),
	);

	const inviteFilters = buildCaseInsensitiveFilters(emails, teamInvites.email);
	const inviteCondition =
		inviteFilters.length === 1 ? inviteFilters[0] : or(...inviteFilters);

	const pendingInvites = await db
		.select({ email: teamInvites.email })
		.from(teamInvites)
		.where(and(eq(teamInvites.teamId, teamId), inviteCondition));

	const pendingInviteEmails = new Set(
		pendingInvites.map((invite) => invite.email?.toLowerCase()).filter(Boolean),
	);

	const validInvites: typeof uniqueInvites = [];
	const skippedInvites: InviteValidationResult["skippedInvites"] = [];

	for (const invite of uniqueInvites) {
		const emailLower = invite.email.toLowerCase();

		if (existingMemberEmails.has(emailLower)) {
			skippedInvites.push({
				email: invite.email,
				reason: "already_member",
			});
			continue;
		}

		if (pendingInviteEmails.has(emailLower)) {
			skippedInvites.push({
				email: invite.email,
				reason: "already_invited",
			});
			continue;
		}

		validInvites.push(invite);
	}

	return { validInvites, skippedInvites };
}

export async function createTeamInvites(
	db: Database,
	params: CreateTeamInvitesParams,
) {
	const { teamId, invites } = params;

	const { validInvites, skippedInvites } = await validateInvites(
		db,
		teamId,
		invites,
	);

	if (validInvites.length === 0) {
		return {
			results: [],
			skippedInvites,
		};
	}

	const results = await Promise.all(
		validInvites.map(async (invite) => {
			const [row] = await db
				.insert(teamInvites)
				.values({
					teamId,
					email: invite.email,
					role: invite.role,
					invitedBy: invite.invitedBy,
				})
				.onConflictDoNothing({
					target: [teamInvites.teamId, teamInvites.email],
				})
				.returning({
					id: teamInvites.id,
					email: teamInvites.email,
					role: teamInvites.role,
					invitedBy: teamInvites.invitedBy,
					teamId: teamInvites.teamId,
				});

			if (!row) {
				return null;
			}

			const team = await db.query.teams.findFirst({
				where: eq(teams.id, teamId),
				columns: {
					id: true,
					name: true,
				},
			});

			return {
				email: row.email,
				role: row.role,
				invitedBy: row.invitedBy,
				team,
			};
		}),
	);

	return {
		results: results.filter(Boolean),
		skippedInvites,
	};
}
