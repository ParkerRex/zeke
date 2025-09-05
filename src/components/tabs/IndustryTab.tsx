'use client';
import { useEffect, useMemo, useState } from 'react';

import { Tab } from '@/lib/tabsStore';
import type { Cluster } from '@/features/stories';
import StoryRow from '@/components/feed/StoryRow';

export default function IndustryTab({ tab }: { tab: Tab }) {
  const industry = (tab.context?.industry as string | undefined) ?? 'All';
  const sub = tab.context?.subindustry as string | undefined;

  const [clusters, setClusters] = useState<Cluster[]>([]);
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/stories', { signal: ac.signal });
        const json = await res.json();
        if (!ac.signal.aborted) setClusters(json.clusters ?? []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        console.error(e);
      }
    })();
    return () => ac.abort('IndustryTab unmounted');
  }, []);

  const filtered = useMemo(() => filterByIndustry(clusters, industry, sub), [clusters, industry, sub]);

  return (
    <div className='h-full overflow-auto'>
      <div className='border-b bg-background/50 p-3 text-sm font-medium'>
        Sector {industry ? `› ${industry}` : ''} {sub ? `› ${sub}` : ''}
      </div>
      <div className='space-y-2 p-4'>
        {filtered.length ? (
          filtered.map((c) => <StoryRow key={c.id} cluster={c} />)
        ) : (
          <div className='text-sm text-gray-500'>No stories matched — showing all.</div>
        )}
      </div>
    </div>
  );
}

function filterByIndustry(list: Cluster[], industry?: string, sub?: string) {
  if (!industry || industry === 'All') return list;
  const t = `${industry} ${sub ?? ''}`.toLowerCase();
  // very light stub: filter by simple keywords in title/url
  const KEYWORDS: Record<string, string[]> = {
    marketing: ['marketing', 'brand', 'growth', 'seo', 'ads'],
    design: ['design', 'ux', 'ui', 'figma'],
    creative: ['video', 'youtube', 'podcast', 'creator'],
    'software development': ['github', 'framework', 'react', 'open source', 'dev'],
    'ai/ml tools': ['agent', 'llm', 'vector', 'embedding', 'benchmark'],
    research: ['arxiv', 'paper', 'study'],
  };
  const keys = Object.entries(KEYWORDS).find(([k]) => t.includes(k))?.[1] ?? [];
  if (!keys.length) return list;
  return list.filter((c) =>
    keys.some((k) => c.title.toLowerCase().includes(k) || c.primaryUrl.toLowerCase().includes(k))
  );
}
