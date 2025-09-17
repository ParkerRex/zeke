"use client";
import { Checkbox } from "@zeke/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@zeke/ui/collapsible";
import { useEffect, useMemo, useRef, useState } from "react";

type Story = {
	id: string;
	kind: "article" | "youtube" | "podcast";
	title: string;
	url?: string;
	content?: string; // for text-based stories
};

type Note = {
	id: string;
	text: string;
	citation?: { title: string; url?: string };
	showCitation: boolean;
};

function sampleStories(): Story[] {
	return [
		{
			id: "s1",
			kind: "article",
			title: "The Quiet Rise of AI Agents in the Enterprise",
			url: "https://example.com/ai-agents-enterprise",
			content:
				"AI agents are transitioning from prototypes to production systems. Early adopters report meaningful gains in support workflows and data analysis tasks. However, reliability and governance remain top concerns for teams shipping agentic workflows at scale.",
		},
		{
			id: "s2",
			kind: "article",
			title: "Edge Compute Economics: When Latency Becomes Strategy",
			url: "https://example.com/edge-economics",
			content:
				"As applications push intelligence closer to users, latency-sensitive workloads create new opportunities for edge-first architectures. The competitive frontier is shifting from raw compute to the ability to deliver consistently low-latency experiences worldwide.",
		},
		{
			id: "s3",
			kind: "youtube",
			title: "Scaling Laws for Neural Language Models (Talk)",
			url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		},
	];
}

export default function ArtifactsClient() {
	const stories = useMemo(() => sampleStories(), []);
	const [expanded, setExpanded] = useState<string[]>(
		[stories[0]?.id].filter(Boolean),
	);
	const [notes, setNotes] = useState<Note[]>([]);
	const [draft, setDraft] = useState("");
	const [showNotes, setShowNotes] = useState(false);

	// Selection UI state
	const [selectionUI, setSelectionUI] = useState<null | {
		x: number;
		y: number;
		storyId: string;
		range: Range;
	}>(null);

	const containerRef = useRef<HTMLDivElement | null>(null);

	// Dismiss the selection prompt on Escape or clicking elsewhere
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setSelectionUI(null);
			}
		};
		const onClick = (e: MouseEvent) => {
			const ui = selectionUI;
			if (!ui) {
				return;
			}
			const target = e.target as Node | null;
			const within = containerRef.current?.contains(target as Node) ?? false;
			if (!within) {
				setSelectionUI(null);
			}
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("mousedown", onClick);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("mousedown", onClick);
		};
	}, [selectionUI]);

	// Detect text selection release within a story content block
	const handleMouseUp: React.MouseEventHandler<HTMLDivElement> = (_e) => {
		const sel = window.getSelection();
		if (!sel || sel.isCollapsed) {
			setSelectionUI(null);
			return;
		}

		// Ensure selection is within a story content container
		const anchor = sel.anchorNode as Node | null;
		const focus = sel.focusNode as Node | null;
		const root = containerRef.current;
		if (!(anchor && focus && root)) {
			return;
		}

		const toElement = (n: Node | null): Element | null =>
			n instanceof Element
				? n
				: ((n as Node & { parentElement?: Element }).parentElement ?? null);
		const contentEl = toElement(anchor)?.closest(
			"[data-story-id]",
		) as HTMLElement | null;
		const contentEl2 = toElement(focus)?.closest(
			"[data-story-id]",
		) as HTMLElement | null;
		if (!(contentEl && contentEl2) || contentEl !== contentEl2) {
			return;
		}

		const storyId = contentEl.getAttribute("data-story-id") || "";
		if (!storyId) {
			return;
		}

		// Position a small prompt near the selection
		const range = sel.getRangeAt(0);
		const rect = range.getBoundingClientRect();
		const x = rect.left + Math.min(rect.width / 2, 120);
		const y = rect.top - 8; // above selection
		setSelectionUI({ x, y, storyId, range });
	};

	const addSelectionToNotes = () => {
		if (!selectionUI) {
			return;
		}
		const { range, storyId } = selectionUI;
		const text = range.cloneContents().textContent?.trim() || "";
		if (!text) {
			setSelectionUI(null);
			return;
		}
		const story = stories.find((s) => s.id === storyId);
		setNotes((prev) => [
			{
				id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
				text,
				citation: story ? { title: story.title, url: story.url } : undefined,
				showCitation: true,
			},
			...prev,
		]);

		// Try to visually highlight in the story content
		try {
			const mark = document.createElement("mark");
			mark.style.background = "rgba(250, 204, 21, 0.6)"; // amber-300-ish
			mark.style.padding = "0 2px";
			range.surroundContents(mark);
		} catch (_err) {
			// If surround fails (split nodes), skip highlighting.
		}

		setSelectionUI(null);
		window.getSelection()?.removeAllRanges();
	};

	const addDraftNote = () => {
		const text = draft.trim();
		if (!text) {
			return;
		}
		setNotes((prev) => [
			{ id: `n_${Date.now()}`, text, showCitation: false },
			...prev,
		]);
		setDraft("");
	};

	return (
		<div className="grid h-full grid-rows-[auto_1fr]">
			<div className="border-b bg-background/50 p-3 backdrop-blur">
				Artifacts
			</div>
			<div className="grid h-full min-h-0 grid-cols-12">
				{/* Left: All saved stories list with expandable text stories for selection */}
				<div className="col-span-12 min-h-0 border-r lg:col-span-7">
					<div
						className="h-full overflow-auto p-3"
						onMouseUp={handleMouseUp}
						ref={containerRef}
					>
						<div className="mb-3 text-muted-foreground text-sm">
							All saved stories
						</div>
						<ul className="space-y-3">
							{stories.map((s) => {
								const isText = s.kind === "article" && s.content;
								const isOpen = expanded.includes(s.id);
								return (
									<li className="rounded-md border bg-white" key={s.id}>
										<button
											className="flex w-full items-center justify-between gap-3 rounded-t-md p-3 text-left hover:bg-gray-50"
											onClick={() =>
												setExpanded((prev) =>
													prev.includes(s.id)
														? prev.filter((x) => x !== s.id)
														: [...prev, s.id],
												)
											}
											type="button"
										>
											<div className="min-w-0">
												<div className="truncate font-medium">{s.title}</div>
												<div className="truncate text-muted-foreground text-xs">
													{s.kind === "article"
														? "Article"
														: s.kind === "youtube"
															? "YouTube"
															: "Podcast"}
													{s.url ? ` • ${s.url}` : ""}
												</div>
											</div>
											<div className="text-muted-foreground text-xs">
												{isOpen ? "Hide" : "Open"}
											</div>
										</button>
										{isOpen && (
											<div className="border-t p-3">
												{isText ? (
													<div
														className="select-text text-sm leading-7"
														data-story-id={s.id}
														style={{ whiteSpace: "pre-wrap" }}
													>
														{s.content}
													</div>
												) : (
													<div className="text-muted-foreground text-sm">
														This is a non-text story ({s.kind}). Open the link
														to view:
														<div>
															<a
																className="underline"
																href={s.url}
																rel="noreferrer"
																target="_blank"
															>
																{s.url}
															</a>
														</div>
													</div>
												)}
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</div>
				</div>

				{/* Right: Note composer */}
				<div className="col-span-12 min-h-0 lg:col-span-5">
					<div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3">
						{/* Composer fills the entire split for a true note feel */}
						<div className="flex items-center justify-between">
							<div className="font-medium text-sm">Composer</div>
							<div className="flex items-center gap-2">
								<Collapsible onOpenChange={setShowNotes} open={showNotes}>
									<CollapsibleTrigger asChild>
										<Button size="sm" variant="ghost">
											Notes ({notes.length})
										</Button>
									</CollapsibleTrigger>
									<CollapsibleContent className="mt-2">
										<div className="max-h-[40vh] overflow-auto rounded-md border bg-white p-2">
											{notes.length === 0 ? (
												<div className="text-muted-foreground text-sm">
													No notes yet. Select text in a story to add one.
												</div>
											) : (
												<ul className="space-y-3">
													{notes.map((n) => (
														<li
															className="rounded-md border bg-white p-3"
															key={n.id}
														>
															<div className="whitespace-pre-wrap text-sm">
																{n.text}
															</div>
															{n.citation ? (
																<div className="mt-2 flex items-center gap-2">
																	<Checkbox
																		checked={n.showCitation}
																		id={`c_${n.id}`}
																		onCheckedChange={(v) =>
																			setNotes((prev) =>
																				prev.map((x) =>
																					x.id === n.id
																						? { ...x, showCitation: Boolean(v) }
																						: x,
																				),
																			)
																		}
																	/>
																	<label
																		className="select-none text-muted-foreground text-xs"
																		htmlFor={`c_${n.id}`}
																	>
																		Show citation
																	</label>
																</div>
															) : null}
															{n.citation && n.showCitation ? (
																<div className="mt-1 text-muted-foreground text-xs">
																	{n.citation.url ? (
																		<a
																			className="underline"
																			href={n.citation.url}
																			rel="noreferrer"
																			target="_blank"
																		>
																			{n.citation.title}
																		</a>
																	) : (
																		<span>{n.citation.title}</span>
																	)}
																</div>
															) : null}
														</li>
													))}
												</ul>
											)}
										</div>
									</CollapsibleContent>
								</Collapsible>
								<Button onClick={addDraftNote} size="sm">
									Add Note
								</Button>
							</div>
						</div>

						<div className="min-h-0 flex-1">
							<textarea
								className="h-full w-full resize-none rounded-md border p-3 text-sm"
								onChange={(e) => setDraft(e.target.value)}
								placeholder="Write a note or paste a thought..."
								value={draft}
							/>
						</div>
					</div>
				</div>

				{/* Floating selection prompt */}
				{selectionUI ? (
					<div
						className="fixed z-50"
						style={{
							left: Math.max(8, selectionUI.x),
							top: Math.max(8, selectionUI.y),
						}}
					>
						<div className="flex items-center gap-2 rounded-md border bg-white p-2 shadow-md">
							<span className="text-muted-foreground text-xs">
								Add selection to notes?
							</span>
							<Button onClick={addSelectionToNotes} size="sm">
								Add
							</Button>
							<Button
								onClick={() => setSelectionUI(null)}
								size="sm"
								variant="ghost"
							>
								Cancel
							</Button>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
