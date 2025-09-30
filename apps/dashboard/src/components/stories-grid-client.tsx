"use client";
import { useStories } from "@/hooks/use-stories";
import { useTabs } from "@/src/hooks/use-tabs";
import { STRINGS } from "@/src/utils/constants";
import { kindParser, qParser } from "@/src/utils/nuqs";
import { domainFromUrl } from "@/src/utils/url";
import type { StoryClusterView } from "@/utils/stories";
import { Button } from "@zeke/ui/button";
import { Input } from "@zeke/ui/input";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import {
  IoCodeSlash,
  IoDocumentText,
  IoLogoReddit,
  IoLogoYoutube,
  IoMic,
  IoNewspaper,
  IoSearch,
} from "react-icons/io5";
import { StoryKindIcon } from "./story-kind-icon";

type GridKindFilter =
  | "all"
  | "youtube"
  | "arxiv"
  | "podcast"
  | "reddit"
  | "hn"
  | "article";
type IconComp = React.ComponentType<{ className?: string }>;
const mediums: { key: GridKindFilter; label: string; Icon: IconComp }[] = [
  { key: "all", label: "All", Icon: IoNewspaper },
  { key: "youtube", label: "YouTube", Icon: IoLogoYoutube },
  { key: "arxiv", label: "arXiv", Icon: IoDocumentText },
  { key: "podcast", label: "Podcast", Icon: IoMic },
  { key: "reddit", label: "Reddit", Icon: IoLogoReddit },
  { key: "hn", label: "HN", Icon: IoCodeSlash },
  { key: "article", label: "Article", Icon: IoNewspaper },
];

const SEARCH_DEBOUNCE_MS = 250;
const MAX_QUERY_LENGTH = 200;

export default function StoriesGridClient({
  variant = "full",
}: {
  variant?: "full" | "embedded";
}) {
  const { openTab } = useTabs();
  const router = useRouter();
  const [q, setQ] = useQueryState("q", qParser);
  const [kindRaw, setKind] = useQueryState("kind", kindParser);
  const kind: GridKindFilter = (kindRaw ?? "all") as GridKindFilter;
  const [qInput, setQInput] = useState(q || "");

  // Use server-side filtering with the new hook
  const {
    stories: items,
    pagination,
    loading,
    error,
    reload,
    loadMore,
  } = useStories({
    kind,
    q: q || undefined,
    limit: 20,
  });

  // Keep input field in sync with URL q
  useEffect(() => {
    setQInput(q || "");
  }, [q]);

  // Debounce text changes before writing to URL
  useEffect(() => {
    const t = setTimeout(() => {
      const clamped = qInput ? qInput.slice(0, MAX_QUERY_LENGTH) : "";
      setQ(clamped || null); // null removes the param
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [qInput, setQ]);

  // No client-side filtering needed - all done server-side
  const filtered = items;

  const openPreview = (c: StoryClusterView) =>
    openTab({
      id: c.id,
      title: c.title,
      embedKind: c.embedKind,
      embedUrl: c.embedUrl,
      clusterId: c.id,
      overlays: c.overlays,
      preview: true,
    });
  const openPermanent = (c: StoryClusterView) => {
    router.push(`/stories/${encodeURIComponent(c.id)}`);
  };

  return (
    <div className="relative h-full overflow-auto">
      {variant === "full" && (
        <>
          <div
            aria-hidden
            className="-z-10 pointer-events-none absolute inset-x-0 top-0 h-[200px]"
            style={{
              background:
                "radial-gradient(800px 300px at 10% 0%, rgba(14,165,233,0.08), transparent), radial-gradient(800px 300px at 90% 0%, rgba(168,85,247,0.07), transparent) , linear-gradient(180deg, #f8fafc 0%, transparent 70%)",
            }}
          />

          <div className="space-y-5 p-4">
            <div className="text-center">
              <h2 className="mb-3 font-semibold text-2xl">Discover stories</h2>
              <div className="mx-auto flex max-w-2xl items-center gap-2">
                <div className="relative w-full">
                  <IoSearch className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 text-gray-400" />
                  <Input
                    className="h-11 rounded-lg pl-9"
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Search stories (title or URL)…"
                    value={qInput}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {mediums.map((m) => (
                <Button
                  className="flex items-center gap-2"
                  key={m.key}
                  onClick={() => setKind(m.key === "all" ? null : m.key)}
                  size="sm"
                  variant={m.key === kind ? "default" : "outline"}
                >
                  <m.Icon className="h-4 w-4" /> {m.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      <section className={variant === "full" ? "p-4" : "p-3"}>
        {
          // Avoid nested ternaries for readability and lint
          (() => {
            if (loading) {
              return (
                <div className="p-3 text-muted-foreground text-sm">
                  {STRINGS.loading}
                </div>
              );
            }
            if (error) {
              return (
                <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span className="text-red-600">
                    {error || STRINGS.loadError}
                  </span>
                  <button
                    className="rounded bg-gray-900 px-3 py-1 text-white hover:opacity-90"
                    onClick={reload}
                    type="button"
                  >
                    {STRINGS.retry}
                  </button>
                </div>
              );
            }
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((c) => (
                    <button
                      className="group rounded-md border bg-white p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm"
                      key={c.id}
                      onClick={() => openPreview(c)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        openPermanent(c);
                      }}
                      type="button"
                    >
                      <div className="mb-2 flex items-center gap-2 font-medium text-sm">
                        <StoryKindIcon kind={c.embedKind} />
                        <span className="truncate">{c.title}</span>
                      </div>
                      <div className="truncate text-gray-500 text-xs">
                        {domainFromUrl(c.primaryUrl)}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Load More Button */}
                {pagination?.hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="outline"
                      className="min-w-32"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}

                {/* Pagination Info */}
                {pagination && (
                  <div className="text-center text-gray-500 text-sm">
                    Showing {filtered.length} of {pagination.totalCount} stories
                  </div>
                )}
              </div>
            );
          })()
        }
      </section>
    </div>
  );
}
