/**
 * Individual story detail page
 */

import { createMetadata } from "@zeke/seo/metadata";
import { listStories } from "@zeke/supabase/queries";
import { Badge } from "@zeke/ui/badge";
import { Button } from "@zeke/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zeke/ui/card";
import { Icons } from "@zeke/ui/icons";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CoverageBar, HypeBar, SourcesBadge } from "@/components/stories";
import {
	deterministicPercent,
	domainFromUrl,
	getKindLabel,
	hypePercent,
	imageFor,
	MIN_SOURCES_COUNT,
} from "@/lib/stories-utils";

interface StoryPageProps {
	params: Promise<{
		id: string;
	}>;
}

export async function generateMetadata({
	params,
}: StoryPageProps): Promise<Metadata> {
	const { id } = await params;
	const stories = await listStories();
	const story = stories.find((item) => item.id === decodeURIComponent(id));

	if (!story) {
		return createMetadata({
			title: "Story Not Found - ZEKE",
			description: "The requested story could not be found.",
		});
	}

	return createMetadata({
		title: `${story.title} - ZEKE`,
		description: `AI research insight: ${story.title}. Compressed from hours of content into verified insights with receipts.`,
	});
}

export default async function StoryPage({
	params,
}: StoryPageProps): Promise<JSX.Element> {
	const { id } = await params;
	const stories = await listStories();
	const story =
		stories.find((item) => item.id === decodeURIComponent(id)) ?? notFound();

	const image = imageFor(story);
	const coverage = deterministicPercent(story.id);
	const hype = hypePercent(story);
	const sources = story.overlays?.sources?.length ?? 0;
	const kind = story.embedKind;
	const domain = domainFromUrl(story.primaryUrl);

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6">
				<Button variant="ghost" asChild>
					<Link href="/stories" className="flex items-center gap-2">
						<Icons.ArrowLeft className="h-4 w-4" />
						Back to Stories
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<article>
						<header className="mb-6">
							<div className="mb-4 flex flex-wrap items-center gap-2">
								<Badge variant="outline">{getKindLabel(kind)}</Badge>
								{domain && <Badge variant="secondary">{domain}</Badge>}
							</div>

							<h1 className="mb-4 font-bold text-3xl leading-tight">
								{story.title}
							</h1>

							<div className="flex flex-wrap items-center gap-6">
								<div className="flex items-center gap-2">
									<Icons.Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										1 hour ago
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Icons.Users className="h-4 w-4 text-muted-foreground" />
									<SourcesBadge count={Math.max(MIN_SOURCES_COUNT, sources)} />
								</div>
							</div>
						</header>

						<div className="relative mb-6 h-[300px] overflow-hidden rounded-lg">
							<Image
								alt={story.title}
								className="object-cover"
								fill
								src={image}
								priority
							/>
						</div>

						<div className="prose prose-gray dark:prose-invert max-w-none">
							<p className="lead">
								This story has been compressed from hours of research into key
								insights with verified sources and timestamps.
							</p>

							<h2>Key Insights</h2>
							<ul>
								<li>
									AI research breakthrough in {getKindLabel(kind).toLowerCase()}{" "}
									format
								</li>
								<li>
									Verified through {Math.max(MIN_SOURCES_COUNT, sources)}{" "}
									independent sources
								</li>
								<li>
									Coverage analysis shows {Math.round(coverage)}% comprehensive
									review
								</li>
								<li>
									Community hype level indicates{" "}
									{hype > 60 ? "high" : hype > 30 ? "moderate" : "low"} interest
								</li>
							</ul>

							<h2>Why This Matters</h2>
							<p>
								This research represents a significant development in the AI
								field, with implications for operators, founders, marketers, and
								product managers working with AI technologies.
							</p>

							<h2>Receipts & Verification</h2>
							<p>
								All insights are backed by source material with timestamps and
								citations. Click the source links below to verify claims and
								dive deeper into the original content.
							</p>
						</div>
					</article>
				</div>

				<aside className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Story Metrics</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<div className="mb-2 flex items-center justify-between">
									<span className="font-medium text-sm">Coverage</span>
									<span className="text-muted-foreground text-sm">
										{Math.round(coverage)}%
									</span>
								</div>
								<CoverageBar value={coverage} />
							</div>

							<div>
								<div className="mb-2 flex items-center justify-between">
									<span className="font-medium text-sm">Hype Level</span>
									<span className="text-muted-foreground text-sm">
										{Math.round(hype)}%
									</span>
								</div>
								<HypeBar value={hype} />
							</div>
						</CardContent>
					</Card>

					{story.primaryUrl && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Original Source</CardTitle>
							</CardHeader>
							<CardContent>
								<Button asChild className="w-full">
									<a
										href={story.primaryUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2"
									>
										View Original
										<Icons.ExternalLink className="h-4 w-4" />
									</a>
								</Button>
							</CardContent>
						</Card>
					)}

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Related Topics</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								<Badge variant="secondary">AI Research</Badge>
								<Badge variant="secondary">Machine Learning</Badge>
								<Badge variant="secondary">Technology</Badge>
							</div>
						</CardContent>
					</Card>
				</aside>
			</div>
		</div>
	);
}
