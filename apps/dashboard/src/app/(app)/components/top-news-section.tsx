import { domainFromUrl } from '@/src/utils/url';
import { listStories } from '@zeke/supabase/queries';
import type { Cluster } from '@zeke/supabase/types';
import Image from 'next/image';
import Link from 'next/link';
import { IoCalendarClear } from 'react-icons/io5';

type Props = {
  title?: string;
  limit?: number;
  showDate?: boolean;
  stories?: Cluster[];
};

function imageFor(_story?: Cluster) {
  return '/hero-shape.png';
}

function hypePercent(c: Cluster) {
  const chili = Number(c?.overlays?.chili ?? 0);
  const pct = Math.max(0, Math.min(5, chili)) * 20; // map 0..5 → 0..100
  return pct;
}

function HypeBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-gray-600">
        <span>Hype score</span>
        <span className="font-medium">{v}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-gray-200">
        <div className="h-full bg-red-500" style={{ width: `${v}%` }} />
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

function TopNewsCard({ story }: { story: Cluster }) {
  const img = imageFor(story);
  const sources = story.overlays?.sources?.length ?? 0;
  const hype = hypePercent(story);
  const domain = domainFromUrl(story.primaryUrl);
  return (
    <article className="rounded-md border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between text-[11px] text-gray-500">
        <span>• {domain || 'AI'}</span>
        {/* Placeholder for bookmark icon */}
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
        <HypeBar value={hype} />
        <SourcesBadge count={Math.max(2, sources)} />
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

export default async function TopNewsSection({
  title = 'Top News',
  limit = 6,
  showDate = true,
  stories,
}: Props) {
  const items = stories ?? (await listStories());
  const grid = items.slice(0, limit);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between text-gray-800 text-sm">
        <h2 className="font-bold text-2xl">{title}</h2>
        {showDate && (
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <span>•</span>
            <IoCalendarClear className="opacity-70" />
            <span>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>
      <div className="mb-4 space-y-[2px]">
        <div className="h-[2px] bg-gray-900" />
        <div className="h-[2px] bg-gray-900" />
        <div className="h-[1px] bg-gray-900" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grid.map((s) => (
          <TopNewsCard key={s.id} story={s} />
        ))}
      </div>
      <div className="mt-4">
        <Link
          className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          href="/stories"
        >
          Show More{' '}
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
        </Link>
      </div>
    </section>
  );
}
