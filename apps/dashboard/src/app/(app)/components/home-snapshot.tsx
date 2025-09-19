"use client";
import type { StoryClusterView } from "@/utils/stories";
import { Button } from "@zeke/ui/button";
import { Input } from "@zeke/ui/input";
import { useEffect, useState } from "react";
import { GiHorseHead } from "react-icons/gi";
import {
	IoBusiness,
	IoCalendarClear,
	IoCashOutline,
	IoGitBranch,
	IoSearch,
	IoTrendingUp,
} from "react-icons/io5";
import { StoryKindIcon } from "./story-kind-icon";

export default function HomeSnapshot() {
	const [clusters, setClusters] = useState<StoryClusterView[]>([]);
	useEffect(() => {
		const ac = new AbortController();
		(async () => {
			try {
				const res = await fetch("/api/stories", { signal: ac.signal });
				const json = await res.json();
				if (!ac.signal.aborted) {
					setClusters(json.stories ?? []);
				}
			} catch (e: unknown) {
				const { isAbortError } = await import("@/src/utils/errors");
				if (isAbortError(e)) {
					return;
				}
				// Swallow errors for this snapshot view; hook into reporting later.
			}
		})();
		return () => ac.abort("HomeSnapshot unmounted");
	}, []);

	const ITEMS_PER_SECTION = 5;
	const MINI_LIST_COUNT = 3;
	const top = clusters.slice(0, ITEMS_PER_SECTION);
	const youtube = clusters
		.filter((c) => c.embedKind === "youtube")
		.slice(0, ITEMS_PER_SECTION);
	const arxiv = clusters
		.filter((c) => c.embedKind === "arxiv")
		.slice(0, ITEMS_PER_SECTION);
	const podcasts = clusters
		.filter((c) => c.embedKind === "podcast")
		.slice(0, ITEMS_PER_SECTION);

	return (
		<div className="relative h-full overflow-auto">
			{/* Soft background aesthetics */}
			<div
				aria-hidden
				className="-z-10 pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(1200px 600px at 10% -10%, rgba(14,165,233,0.08), transparent), radial-gradient(1000px 500px at 90% 0%, rgba(59,130,246,0.07), transparent), linear-gradient(180deg, #f8fafc 0%, #ffffff 60%)",
				}}
			/>

			{/* Floating page card */}
			<div className="m-3 overflow-hidden rounded-xl border bg-white shadow-sm ring-1 ring-black/5">
				{/* Hero: discovery query */}
				<div className="border-b bg-gradient-to-b from-gray-50 to-transparent p-6 text-center">
					<h2 className="mb-2 font-semibold text-2xl tracking-tight">
						What will you discover today?
					</h2>
					<p className="mx-auto mb-4 max-w-2xl text-gray-600 text-sm">
						Quickly scan AI’s signal — trending stories, ships, fundraises, and
						the horses’ mouth.
					</p>
					<div className="relative mx-auto max-w-2xl">
						<IoSearch className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 text-gray-400" />
						<Input
							className="h-11 rounded-lg border-gray-200 pl-9"
							placeholder="e.g., “best AI coding model for Python”"
						/>
					</div>
				</div>

				{/* Content grid */}
				<div className="grid grid-cols-1 gap-6 p-4 xl:grid-cols-2">
					<Card
						Icon={IoTrendingUp}
						subtitle="A quick pulse — today, week, month"
						title="Trending now"
					>
						<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
							<MiniList items={top.slice(0, MINI_LIST_COUNT)} label="Today" />
							<MiniList
								items={top.slice(0, MINI_LIST_COUNT)}
								label="This week"
							/>
							<MiniList
								items={top.slice(0, MINI_LIST_COUNT)}
								label="This month"
							/>
						</div>
					</Card>

					<Card
						Icon={IoBusiness}
						subtitle="Notable updates from your watchlist"
						title="What changed — Companies you follow"
					>
						<ul className="space-y-2 text-gray-700 text-sm leading-6">
							<li>
								<span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
								Anthropic: updated Claude Enterprise pricing page
							</li>
							<li>
								<span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 align-middle" />
								Mistral: published 8x7B performance blog
							</li>
							<li>
								<span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-orange-400 align-middle" />
								OpenAI: job posting spike in evals
							</li>
						</ul>
					</Card>

					<Card
						Icon={IoGitBranch}
						subtitle="Fresh code in popular AI repos"
						title="What shipped — PRs merged"
					>
						<ul className="space-y-2 text-gray-700 text-sm leading-6">
							<li>
								<code className="rounded bg-gray-100 px-1 py-0.5">
									LangChain
								</code>{" "}
								agents v2 (12 files)
							</li>
							<li>
								<code className="rounded bg-gray-100 px-1 py-0.5">
									llama.cpp
								</code>{" "}
								KV cache perf on Apple M‑series
							</li>
							<li>
								<code className="rounded bg-gray-100 px-1 py-0.5">
									Vercel AI SDK
								</code>{" "}
								backoff on 429
							</li>
						</ul>
					</Card>

					<Card
						Icon={IoCalendarClear}
						subtitle="Add events to calendar"
						title="Upcoming livestreams & announcements"
					>
						<ul className="space-y-3 text-gray-700 text-sm">
							<li className="flex items-center justify-between">
								<span>OpenRouter Spaces Live — Today 4:00pm PT</span>
								<Button size="sm" variant="outline">
									Add to calendar
								</Button>
							</li>
							<li className="flex items-center justify-between">
								<span>Anthropic product update — Thu 10:00am PT</span>
								<Button size="sm" variant="outline">
									Add to calendar
								</Button>
							</li>
						</ul>
					</Card>

					<Card
						Icon={IoCashOutline}
						subtitle="Signals and momentum"
						title="Big news — Fundraises"
					>
						<ul className="space-y-2 text-gray-700 text-sm leading-6">
							<li>
								<span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700 text-xs">
									Series B
								</span>{" "}
								Mistral raises €X0M (report)
							</li>
							<li>
								<span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 text-xs">
									Strategic
								</span>{" "}
								Perplexity raises $Y0M (rumor)
							</li>
						</ul>
					</Card>

					<Card title="Top trending — Today">
						<SimpleList empty="No stories" items={top} />
					</Card>
					<Card title="Top YouTube">
						<SimpleList empty="No YouTube stories yet." items={youtube} />
					</Card>
					<Card title="Top arXiv">
						<SimpleList empty="No arXiv papers yet." items={arxiv} />
					</Card>
					<Card title="Top Podcasts">
						<SimpleList empty="No podcasts yet." items={podcasts} />
					</Card>

					<Card title="Horses’ mouth">
						<ul className="space-y-2 text-gray-700 text-sm">
							<li className="flex items-center gap-2">
								<GiHorseHead className="h-4 w-4" /> Elon on X: “New benchmark
								numbers next week”
							</li>
							<li className="flex items-center gap-2">
								<GiHorseHead className="h-4 w-4" /> Anthropic newsroom: “Claude
								3.7 announced”
							</li>
							<li className="flex items-center gap-2">
								<GiHorseHead className="h-4 w-4" /> Model Discord mod:
								“Fine-tuning policy change”
							</li>
						</ul>
					</Card>
				</div>
			</div>
		</div>
	);
}

function Card({
	title,
	children,
	Icon,
	subtitle,
}: {
	title: string;
	children: React.ReactNode;
	Icon?: React.ComponentType<{ className?: string }>;
	subtitle?: string;
}) {
	return (
		<section className="rounded-md border border-gray-200 bg-white p-4 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					{Icon ? <Icon className="h-4 w-4 text-gray-500" /> : null}
					<h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
				</div>
				{subtitle ? (
					<div className="text-gray-500 text-xs">{subtitle}</div>
				) : null}
			</div>
			{children}
		</section>
	);
}

function SimpleList({
  items,
  empty,
}: {
  items: StoryClusterView[];
  empty: string;
}) {
	if (!items.length) {
		return <div className="text-gray-500 text-xs">{empty}</div>;
	}
	return (
		<ul className="space-y-2">
			{items.map((s) => (
				<li className="flex items-center gap-2 truncate text-sm" key={s.id}>
					<StoryKindIcon kind={s.embedKind} />
					<span className="truncate">{s.title}</span>
				</li>
			))}
		</ul>
	);
}

function MiniList({
  label,
  items,
}: {
  label: string;
  items: StoryClusterView[];
}) {
	return (
		<div className="rounded-md border border-gray-200 bg-gray-50 p-3">
			<div className="mb-2 font-medium text-gray-600 text-xs uppercase tracking-wide">
				{label}
			</div>
			<ul className="space-y-1">
				{items.map((s) => (
					<li className="flex items-center gap-2 truncate text-sm" key={s.id}>
						<StoryKindIcon kind={s.embedKind} />
						<span className="truncate">{s.title}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
