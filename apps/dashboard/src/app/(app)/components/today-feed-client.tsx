"use client";

import type { ReactNode } from "react";
import { STRINGS } from "@/src/utils/constants";
import { Button } from "@zeke/ui/button";
import { useStoriesList } from "@/hooks/hooks-use-stories";
import StoryRow from "./story-row";

export default function TodayFeedClient() {
	const {
		data,
		error,
		isLoading,
		refetch,
		isFetching,
	} = useStoriesList({ limit: 20, kind: "all" });

	const clusters = data?.stories ?? [];
	const errorMessage = error instanceof Error ? error.message : null;

	let content: ReactNode;
	if (isLoading) {
		content = (
			<div className="p-3 text-muted-foreground text-sm">
				{STRINGS.loading}
			</div>
		);
	} else if (errorMessage) {
		content = (
			<div className="flex items-center justify-between p-3 text-sm">
				<span className="text-red-600">{errorMessage || STRINGS.loadError}</span>
				<Button onClick={() => refetch()} size="sm" variant="outline">
					{STRINGS.retry}
				</Button>
			</div>
		);
	} else {
		content = (
			<div className="divide-y">
				{clusters.map((c) => (
					<StoryRow cluster={c} key={c.id} />
				))}
			</div>
		);
	}

	return (
		<div>
			<div className="border-b bg-background/50 p-3 font-medium text-sm">
				{"Today's Top Stories"}
			</div>
			{content}
			{isFetching && !isLoading ? (
				<div className="p-3 text-muted-foreground text-xs">{STRINGS.loading}</div>
			) : null}
		</div>
	);
}
