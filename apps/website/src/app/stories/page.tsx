/**
 * Stories listing page
 */

import { createMetadata } from "@zeke/seo/metadata";
import { Button } from "@zeke/ui/button";
import { Input } from "@zeke/ui/input";
import { Icons } from "@zeke/ui/icons";
import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState, PageHeader } from "@/components/layout";
import { StoriesGrid as StoriesGridComponent } from "@/components/stories";
import { fetchStoriesForWebsite } from "@/lib/stories";

interface StoriesPageProps {
	searchParams: Promise<{
		q?: string;
		page?: string;
	}>;
}

export const metadata: Metadata = createMetadata({
	title: "Stories - ZEKE Research Intelligence",
	description:
		"Browse the latest AI research stories, compressed from hours of content into verified insights with receipts.",
});

async function StoriesList({ searchQuery }: { searchQuery?: string }) {
	const { stories } = await fetchStoriesForWebsite();

	const filteredStories = searchQuery
		? stories.filter((story) => {
				const normalizedQuery = searchQuery.toLowerCase();
				return (
					story.title.toLowerCase().includes(normalizedQuery) ||
					story.embedKind?.toLowerCase().includes(normalizedQuery)
				);
			})
		: stories;

	if (filteredStories.length === 0) {
		return (
			<EmptyState
				icon={Icons.FileText}
				title="No stories found"
				description={
					searchQuery
						? `No stories match "${searchQuery}". Try a different search term.`
						: "No stories available at the moment. Check back later!"
				}
				action={
					searchQuery
						? {
								label: "Clear Search",
								href: "/stories",
							}
						: undefined
				}
			/>
		);
	}

	return (
		<StoriesGridComponent
			stories={filteredStories}
			columns={{ sm: 2, lg: 3, xl: 4 }}
		/>
	);
}

function StoriesGridSkeleton(): JSX.Element {
	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: 12 }).map((_, index) => (
				<div key={index} className="animate-pulse">
					<div className="overflow-hidden rounded-lg border bg-card">
						<div className="p-3">
							<div className="mb-2 h-4 w-20 rounded bg-muted" />
							<div className="mb-2 space-y-2">
								<div className="h-5 w-full rounded bg-muted" />
								<div className="h-5 w-3/4 rounded bg-muted" />
							</div>
							<div className="mb-3 flex items-center justify-between gap-3">
								<div className="h-1 flex-1 rounded bg-muted" />
								<div className="h-4 w-16 rounded bg-muted" />
							</div>
							<div className="h-[150px] w-full rounded bg-muted" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

export default async function StoriesPage({
	searchParams,
}: StoriesPageProps): Promise<JSX.Element> {
	const { q: searchQuery } = await searchParams;

	return (
		<div className="container mx-auto py-8">
			<PageHeader
				title="AI Research Stories"
				description="Discover the latest AI research, compressed from hours of content into 5-minute insights with receipts."
			/>
			<div className="mb-8">
				<form className="relative max-w-md">
					<Icons.Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search stories..."
						defaultValue={searchQuery}
						name="q"
						className="pl-10"
					/>
					<Button type="submit" className="sr-only">
						Search
					</Button>
				</form>
			</div>
			<Suspense fallback={<StoriesGridSkeleton />}>
				<StoriesList searchQuery={searchQuery} />
			</Suspense>
		</div>
	);
}
