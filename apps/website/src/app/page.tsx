import { createMetadata } from "@zeke/seo/metadata";
import { getSession } from "@zeke/supabase/cached-queries";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
	AskZekeCard,
	DailyIndexCard,
	LatestStoriesSection,
	PersonalizedStoriesFeed,
	PromoCard,
	TopicsStrip,
	TopStoriesSection,
	TopTopicsSidebar,
} from "@/components/stories";

interface HomePageProps {
	searchParams: Promise<{ code?: string }>;
}

export const metadata: Metadata = createMetadata({
	title: "ZEKE - AI Research Intelligence",
	description:
		"Stay ahead with AI-powered research analysis and insights. Turn 10 hours of research into 5 minutes of verified insights.",
});

export default async function HomePage({
	searchParams,
}: HomePageProps): Promise<JSX.Element> {
	const { code } = await searchParams;

	if (typeof code === "string" && code.length > 0) {
		redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
	}

	const session = await getSession();
	if (session) {
		redirect("/home");
	}

	return (
		<div className="container mx-auto py-4">
			<div className="grid grid-cols-12 gap-4">
				<div className="col-span-12 space-y-4 lg:col-span-8">
					<TopStoriesSection />
					<LatestStoriesSection />
				</div>
				<aside className="col-span-12 space-y-4 lg:col-span-4">
					<DailyIndexCard />
					<AskZekeCard />
					<TopTopicsSidebar />
					<PromoCard />
				</aside>
			</div>
			<PersonalizedStoriesFeed />
			<div className="mt-8">
				<TopicsStrip />
			</div>
		</div>
	);
}
