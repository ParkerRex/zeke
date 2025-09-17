import { auth, currentUser } from "@zeke/auth/server";
import { SidebarProvider } from "@zeke/ui/sidebar";
import type { ReactNode } from "react";
import { PostHogIdentifier } from "./components/posthog-identifier";
import { GlobalSidebar } from "./components/sidebar";

type AppLayoutProperties = {
	readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
	const user = await currentUser();
	const { redirectToSignIn } = await auth();

	if (!user) {
		return redirectToSignIn();
	}

	return (
		<SidebarProvider>
			<GlobalSidebar>{children}</GlobalSidebar>
			<PostHogIdentifier />
		</SidebarProvider>
	);
};

export default AppLayout;
