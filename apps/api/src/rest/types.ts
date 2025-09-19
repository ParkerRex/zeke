// Shared REST context typing for handlers exposing db, session, and derived team id.
import type { Session } from "@api/utils/auth";
import type { Database } from "@zeke/db/client";

export type Context = {
	Variables: {
		db: Database;
		session: Session;
		teamId: string;
	};
};
