"use client";
import { useEffect, useMemo, useState } from 'react';

import type { Cluster } from '@/features/stories';
import { Tab } from '@/lib/tabsStore';
import StoryRow from '@/components/feed/StoryRow';

const COMPANY_KEYWORDS: Record<string, { company: string[]; ceo: string[] }> = {
  openai: { company: ['openai', 'gpt', 'chatgpt'], ceo: ['sam altman'] },
  anthropic: { company: ['anthropic', 'claude'], ceo: ['dario amodei'] },
  deepmind: { company: ['deepmind'], ceo: ['demis hassabis'] },
  meta: { company: ['meta', 'facebook', 'llama'], ceo: ['mark zuckerberg'] },
  mistral: { company: ['mistral'], ceo: ['arthur mensch'] },
  cohere: { company: ['cohere'], ceo: ['aidan gomez'] },
  perplexity: { company: ['perplexity'], ceo: ['aravind srinivas'] },
  stability: { company: ['stability', 'stable diffusion'], ceo: ['emad mostaque'] },
  xai: { company: ['xai'], ceo: ['elon musk'] },
  openrouter: { company: ['openrouter'], ceo: ['emil'] },
};

export default function CompanyTab({ tab }: { tab: Tab }) {
  const name = (tab.context?.company as string) ?? '';
  const slug = (tab.context?.slug as string) ?? '';
  const ceo = (tab.context?.ceo as string) ?? '';
  const domain = (tab.context?.domain as string) ?? '';

  const [clusters, setClusters] = useState<Cluster[]>([]);
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/stories').then((x) => x.json());
      setClusters(r.clusters ?? []);
    })();
  }, []);

  const { news, ceoNews } = useMemo(() => {
    const keys = COMPANY_KEYWORDS[slug] ?? { company: [slug], ceo: [ceo] };
    const inText = (c: Cluster, arr: string[]) =>
      arr.some((k) => `${c.title} ${c.primaryUrl}`.toLowerCase().includes(k));
    return {
      news: clusters.filter((c) => inText(c, keys.company)),
      ceoNews: clusters.filter((c) => inText(c, keys.ceo)),
    };
  }, [clusters, slug, ceo]);

  return (
    <div className='h-full overflow-auto'>
      <div className='flex items-center gap-2 border-b bg-background/50 p-3 text-sm font-medium'>
        {domain ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt='' className='h-5 w-5 rounded' src={`https://logo.clearbit.com/${domain}`} />
        ) : null}
        <span>Company › {name}</span>
      </div>
      <div className='grid grid-cols-1 gap-6 p-4 lg:grid-cols-2'>
        <section>
          <h3 className='mb-2 text-sm font-semibold'>Recent news</h3>
          <div className='divide-y rounded-md border bg-white'>
            {(news.length ? news : clusters).slice(0, 6).map((c) => (
              <StoryRow key={c.id} cluster={c} />
            ))}
          </div>
        </section>
        <section>
          <h3 className='mb-2 text-sm font-semibold'>CEO — {ceo}</h3>
          <div className='divide-y rounded-md border bg-white'>
            {(ceoNews.length ? ceoNews : clusters).slice(0, 6).map((c) => (
              <StoryRow key={c.id} cluster={c} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
