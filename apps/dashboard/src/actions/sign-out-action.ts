"use server";

import { LogEvents } from "@zeke/events/events";
import { setupAnalytics } from "@zeke/events/server";
import { getSession } from "@zeke/supabase/cached-queries";
import { createClient } from "@zeke/supabase/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction() {
	const supabase = createClient();
	const {
		data: { session },
	} = await getSession();

	await supabase.auth.signOut({
		scope: "local",
	});

	const analytics = await setupAnalytics({
		userId: session?.user.id,
		fullName: session?.user.user_metadata?.full_name,
	});

	analytics.track({
		event: LogEvents.SignOut.name,
		channel: LogEvents.SignOut.channel,
	});

	revalidateTag(`user_${session?.user.id}`);

	return redirect("/login");
}
