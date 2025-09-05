"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IoDocumentText, IoLogoReddit, IoLogoYoutube, IoMic, IoNewspaper, IoCodeSlash, IoSearch } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StoryKindIcon } from '@/components/stories/StoryKindIcon';
import type { Cluster, EmbedKind } from '@/features/stories';
import { useTabs } from '@/lib/tabsStore';

const mediums: { key: EmbedKind | 'all'; label: string; Icon: any }[] = [
  { key: 'all', label: 'All', Icon: IoNewspaper },
  { key: 'youtube', label: 'YouTube', Icon: IoLogoYoutube },
  { key: 'arxiv', label: 'arXiv', Icon: IoDocumentText },
  { key: 'podcast', label: 'Podcast', Icon: IoMic },
  { key: 'reddit', label: 'Reddit', Icon: IoLogoReddit },
  { key: 'hn', label: 'HN', Icon: IoCodeSlash },
  { key: 'article', label: 'Article', Icon: IoNewspaper },
];

export default function StoriesGridClient({ variant = 'full' }: { variant?: 'full' | 'embedded' }) {
  const { openTab } = useTabs();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<EmbedKind | 'all'>('all');
  const [items, setItems] = useState<Cluster[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/stories', { signal: ac.signal })
      .then((x) => x.json())
      .then((r) => setItems(r.clusters ?? []))
      .catch((e) => {
        // Swallow intentional aborts; surface everything else.
        if (e?.name !== 'AbortError') console.error(e);
      });
    // Provide an explicit reason so dev overlay treats this as intentional.
    return () => ac.abort('StoriesGridClient unmounted');
  }, []);

  // Sync from URL params (used when landed via link)
  useEffect(() => {
    const qs = searchParams?.get('q') ?? '';
    const ks = (searchParams?.get('kind') as EmbedKind | 'all' | null) ?? 'all';
    setQ(qs);
    setKind(ks);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchesKind = kind === 'all' ? true : c.embedKind === kind;
      const matchesQ = q ? `${c.title} ${c.primaryUrl}`.toLowerCase().includes(q.toLowerCase()) : true;
      return matchesKind && matchesQ;
    });
  }, [items, q, kind]);

  const openPreview = (c: Cluster) =>
    openTab({ id: c.id, title: c.title, embedKind: c.embedKind, embedUrl: c.embedUrl, clusterId: c.id, overlays: c.overlays, preview: true });
  const openPermanent = (c: Cluster) =>
    openTab({ id: c.id, title: c.title, embedKind: c.embedKind, embedUrl: c.embedUrl, clusterId: c.id, overlays: c.overlays, preview: false });

  return (
    <div className='relative h-full overflow-auto'>
      {variant === 'full' && (
        <>
          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-[200px]'
            style={{
              background:
                'radial-gradient(800px 300px at 10% 0%, rgba(14,165,233,0.08), transparent), radial-gradient(800px 300px at 90% 0%, rgba(168,85,247,0.07), transparent) , linear-gradient(180deg, #f8fafc 0%, transparent 70%)',
            }}
          />

          <div className='space-y-5 p-4'>
            <div className='text-center'>
              <h2 className='mb-3 text-2xl font-semibold'>Discover stories</h2>
              <div className='mx-auto flex max-w-2xl items-center gap-2'>
                <div className='relative w-full'>
                  <IoSearch className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className='h-11 rounded-lg pl-9'
                    placeholder='Search stories (title or URL)…'
                  />
                </div>
              </div>
            </div>

            <div className='flex flex-wrap items-center justify-center gap-2'>
              {mediums.map((m) => (
                <Button
                  key={m.key}
                  size='sm'
                  variant={m.key === kind ? 'default' : 'outline'}
                  onClick={() => setKind(m.key as any)}
                  className='flex items-center gap-2'
                >
                  <m.Icon className='h-4 w-4' /> {m.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      <section className={variant === 'full' ? 'p-4' : 'p-3'}>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => openPreview(c)}
              onDoubleClick={(e) => { e.preventDefault(); openPermanent(c); }}
              className='group rounded-md border bg-white p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm'
            >
              <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                <StoryKindIcon kind={c.embedKind} />
                <span className='truncate'>{c.title}</span>
              </div>
              <div className='truncate text-xs text-gray-500'>{c.primaryUrl}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
