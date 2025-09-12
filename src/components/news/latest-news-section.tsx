import { listStories } from "@db/queries/stories/list-stories";
import Image from "next/image";
import Link from "next/link";
import type { Cluster } from "@/types/stories";
import { domainFromUrl } from "@/utils/url";

const HASH_MULTIPLIER = 31;
const MIN_COVERAGE_PERCENT = 35;
const MAX_COVERAGE_PERCENT = 90;
const COVERAGE_MAX_PERCENT = 100;
const MIN_SOURCES_COUNT = 3;
const DEFAULT_STORIES_LIMIT = 6;

type Props = {
  title?: string;
  stories?: Cluster[];
  limit?: number;
};

function imageFor(_story?: Cluster) {
  // Placeholder imagery for now; wire real thumbnails later.
  return "/hero-shape.png";
}

function deterministicPercent(
  id: string,
  min = MIN_COVERAGE_PERCENT,
  max = MAX_COVERAGE_PERCENT
) {
  // Simple deterministic range based on id hash
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.floor(
      (h * HASH_MULTIPLIER + id.charCodeAt(i)) % Number.MAX_SAFE_INTEGER
    );
  }
  const span = Math.max(0, max - min);
  return min + (h % (span + 1));
}

function CoverageBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(COVERAGE_MAX_PERCENT, Math.round(value)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-gray-600">
        <span>
          {v}% {label} coverage
        </span>
        <span className="sr-only">Coverage</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-gray-200">
        <div className="h-full bg-blue-600" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function SourcesBadge({ count }: { count: number }) {
  return (
    <div className="rounded bg-gray-900 px-2 py-1 font-medium text-[11px] text-white">
      {count} sources
    </div>
  );
}

function NewsCard({ story }: { story: Cluster }) {
  const img = imageFor(story);
  const coverage = deterministicPercent(story.id);
  const sources = story.overlays?.sources?.length ?? 0;
  const kind = story.embedKind;
  const domain = domainFromUrl(story.primaryUrl);
  return (
    <article className="rounded-md border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between text-[11px] text-gray-500">
        <span>
          • {getKindLabel(kind)}
          {domain ? `, ${domain}` : ""}
        </span>
        {/* Bookmark icon could go here later */}
      </div>
      <h3 className="mb-2 font-semibold leading-snug">
        <Link
          className="hover:underline"
          href={`/stories/${encodeURIComponent(story.id)}`}
        >
          {story.title}
        </Link>
      </h3>
      <div className="mb-2 flex items-center justify-between gap-3">
        <CoverageBar label="left" value={coverage} />
        <SourcesBadge count={Math.max(MIN_SOURCES_COUNT, sources)} />
      </div>
      <div className="relative h-[150px] overflow-hidden rounded">
        <Image alt="" className="object-cover" fill src={img} />
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
          1 hour ago
        </div>
      </div>
    </article>
  );
}

function getKindLabel(kind: string | undefined): string {
  if (kind === "youtube") {
    return "Video";
  }
  if (kind === "arxiv") {
    return "Research";
  }
  return "AI";
}

export async function LatestNewsSection({
  title = "Latest News",
  stories,
  limit = DEFAULT_STORIES_LIMIT,
}: Props) {
  const items = stories ?? (await listStories());
  const grid = items.slice(0, limit);
  return (
    <section className="mt-8">
      <h2 className="mb-2 font-bold text-2xl">{title}</h2>
      {/* Decorative multi-rule under heading to echo reference */}
      <div className="mb-4 space-y-[2px]">
        <div className="h-[2px] bg-gray-900" />
        <div className="h-[2px] bg-gray-900" />
        <div className="h-[1px] bg-gray-900" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {grid.map((s) => (
          <NewsCard key={s.id} story={s} />
        ))}
      </div>
      <div className="mt-4">
        <Link
          className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          href="/stories"
        >
          Show More{" "}
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
        </Link>
      </div>
    </section>
  );
}

export default LatestNewsSection;
