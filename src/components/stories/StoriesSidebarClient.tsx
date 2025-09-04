"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  IoDocumentText,
  IoLogoReddit,
  IoLogoYoutube,
  IoMic,
  IoNewspaper,
  IoCodeSlash,
  IoSearch,
  IoStar,
  IoStarOutline,
  IoGrid,
  IoList,
} from "react-icons/io5";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { StoryKindIcon } from "@/components/stories/StoryKindIcon";
import type { Cluster, EmbedKind } from "@/features/stories";
import { useTabs } from "@/lib/tabsStore";

const mediums: { key: EmbedKind | "all"; label: string; Icon: any }[] = [
  { key: "all", label: "All", Icon: IoNewspaper },
  { key: "youtube", label: "YouTube", Icon: IoLogoYoutube },
  { key: "arxiv", label: "arXiv", Icon: IoDocumentText },
  { key: "podcast", label: "Podcast", Icon: IoMic },
  { key: "reddit", label: "Reddit", Icon: IoLogoReddit },
  { key: "hn", label: "HN", Icon: IoCodeSlash },
  { key: "article", label: "Article", Icon: IoNewspaper },
];

function useSaved() {
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedStories");
      if (raw) setSaved(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const persist = (next: Set<string>) => {
    setSaved(new Set(next));
    try {
      localStorage.setItem("savedStories", JSON.stringify(Array.from(next)));
    } catch {}
  };

  const toggle = (id: string) => {
    const next = new Set(saved);
    next.has(id) ? next.delete(id) : next.add(id);
    persist(next);
  };

  return { saved, toggle } as const;
}

export default function StoriesSidebarClient() {
  const { openTab, tabs, activeId } = useTabs();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<EmbedKind | "all">("all");
  const [scope, setScope] = useState<"all" | "saved">("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [items, setItems] = useState<Cluster[]>([]);
  const { saved, toggle } = useSaved();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/stories").then((x) => x.json());
        setItems(r.clusters ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchesKind = kind === "all" ? true : c.embedKind === kind;
      const matchesQ = q ? `${c.title} ${c.primaryUrl}`.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesSaved = scope === "saved" ? saved.has(c.id) : true;
      return matchesKind && matchesQ && matchesSaved;
    });
  }, [items, q, kind, scope, saved]);

  const active = tabs.find((t) => t.id === activeId);
  const activeClusterId = active?.clusterId ?? active?.id;

  const open = (c: Cluster) =>
    openTab({ id: c.id, title: c.title, embedKind: c.embedKind, embedUrl: c.embedUrl, clusterId: c.id, overlays: c.overlays });

  // Initialize from URL and keep in sync when URL changes (e.g., grid might be visible without a tab)
  useEffect(() => {
    const qs = searchParams?.get('q') ?? '';
    const ks = (searchParams?.get('kind') as EmbedKind | 'all' | null) ?? 'all';
    const vs = (searchParams?.get('view') as 'list' | 'grid' | null) ?? 'list';
    setQ(qs);
    setKind(ks);
    setView(vs);
    // scope intentionally not from URL to avoid confusion
  }, [searchParams]);

  // Persist q/kind/view to URL to drive the grid in the main viewport
  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString());
      if (q) params.set('q', q); else params.delete('q');
      if (kind && kind !== 'all') params.set('kind', kind as string); else params.delete('kind');
      if (view && view !== 'list') params.set('view', view); else params.delete('view');
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, 200);
    return () => clearTimeout(id);
  }, [q, kind, view, pathname, router]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background/50 p-3 text-sm font-medium">Stories</div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* Selected story summary */}
        {active ? (
          <div className="rounded-lg border bg-white p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Selected</span>
              {activeClusterId && saved.has(activeClusterId) ? (
                <Badge className="flex items-center gap-1" variant="secondary">
                  <IoStar className="h-3.5 w-3.5 text-amber-500" /> Saved
                </Badge>
              ) : null}
            </div>
            <div className="flex items-start gap-2">
              <StoryKindIcon kind={active.embedKind} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{active.title}</div>
                <div className="truncate text-[11px] text-gray-500">{active.embedUrl}</div>
                {typeof active.overlays?.chili === "number" ? (
                  <div className="mt-1 text-xs" aria-label="chili">
                    {Array.from({ length: Math.max(0, Math.min(5, active.overlays.chili)) }).map((_, i) => (
                      <span key={i}>🌶</span>
                    ))}
                  </div>
                ) : null}
              </div>
              {activeClusterId ? (
                <button
                  onClick={() => toggle(activeClusterId)}
                  className="p-1 text-gray-500 hover:text-amber-600"
                  title={saved.has(activeClusterId) ? "Unsave" : "Save"}
                >
                  {saved.has(activeClusterId) ? <IoStar className="h-5 w-5" /> : <IoStarOutline className="h-5 w-5" />}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Search + scope selector */}
        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <IoSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9 rounded-md pl-9"
              placeholder="Search stories…"
            />
          </div>
          <Select value={scope} onValueChange={(v) => setScope(v as any)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stories</SelectItem>
              <SelectItem value="saved">Saved only</SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as any)}>
            <ToggleGroupItem value="list" aria-label="List view" className="h-9">
              <IoList className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view" className="h-9">
              <IoGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Medium filters */}
        <div className="flex flex-wrap items-center gap-3">
          {mediums.map((m) => {
            const active = m.key === kind;
            return (
              <button
                key={m.key}
                className={`relative flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors ${
                  active ? "text-gray-900" : ""
                }`}
                onClick={() => setKind(m.key as any)}
              >
                <m.Icon className="h-4 w-4" /> {m.label}
                {active ? <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gray-900" /> : null}
              </button>
            );
          })}
        </div>

        {/* Results list */}
        {view === "list" ? (
          <div className="divide-y rounded-md border bg-white">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No stories match your filters.</div>
            ) : (
              filtered.map((c) => {
                const isSaved = saved.has(c.id);
                return (
                  <div key={c.id} className="flex items-start gap-3 p-3 hover:bg-gray-50">
                    <button onClick={() => open(c)} className="group flex min-w-0 flex-1 items-start gap-3 text-left">
                      <div className="mt-0.5 flex-shrink-0 text-gray-700">
                        <StoryKindIcon kind={c.embedKind} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-900">{c.title}</div>
                        <div className="truncate text-[11px] text-gray-500">{c.primaryUrl}</div>
                        <div className="mt-1 text-xs" aria-label="chili">
                          {Array.from({ length: Math.max(0, Math.min(5, c.overlays.chili)) }).map((_, i) => (
                            <span key={i}>🌶</span>
                          ))}
                        </div>
                      </div>
                    </button>
                    <button
                      aria-label={isSaved ? "Unsave" : "Save"}
                      onClick={() => toggle(c.id)}
                      className="p-1 text-gray-500 hover:text-amber-600"
                      title={isSaved ? "Unsave" : "Save"}
                    >
                      {isSaved ? <IoStar className="h-5 w-5" /> : <IoStarOutline className="h-5 w-5" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.length === 0 ? (
              <div className="col-span-2 p-4 text-sm text-muted-foreground rounded-md border bg-white">
                No stories match your filters.
              </div>
            ) : (
              filtered.map((c) => {
                const isSaved = saved.has(c.id);
                return (
                  <div key={c.id} className="rounded-md border bg-white p-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <StoryKindIcon kind={c.embedKind} />
                        <div className="truncate text-xs font-medium">{c.title}</div>
                      </div>
                      <button
                        aria-label={isSaved ? "Unsave" : "Save"}
                        onClick={() => toggle(c.id)}
                        className="p-1 text-gray-500 hover:text-amber-600"
                        title={isSaved ? "Unsave" : "Save"}
                      >
                        {isSaved ? <IoStar className="h-4 w-4" /> : <IoStarOutline className="h-4 w-4" />}
                      </button>
                    </div>
                    <button onClick={() => open(c)} className="block w-full text-left">
                      <div className="truncate text-[11px] text-gray-500">{c.primaryUrl}</div>
                      <div className="mt-1 text-xs" aria-label="chili">
                        {Array.from({ length: Math.max(0, Math.min(5, c.overlays.chili)) }).map((_, i) => (
                          <span key={i}>🌶</span>
                        ))}
                      </div>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
