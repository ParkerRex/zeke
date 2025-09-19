'use client';
import type { StoryClusterView } from '@/utils/stories';
import { companyViewParser } from '@/src/utils/nuqs';
import type { Tab } from '@/src/hooks/use-tabs';
import Image from 'next/image';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import StoryRow from './story-row';

const COMPANY_KEYWORDS: Record<string, { company: string[]; ceo: string[] }> = {
  openai: { company: ['openai', 'gpt', 'chatgpt'], ceo: ['sam altman'] },
  anthropic: { company: ['anthropic', 'claude'], ceo: ['dario amodei'] },
  deepmind: { company: ['deepmind'], ceo: ['demis hassabis'] },
  meta: { company: ['meta', 'facebook', 'llama'], ceo: ['mark zuckerberg'] },
  mistral: { company: ['mistral'], ceo: ['arthur mensch'] },
  cohere: { company: ['cohere'], ceo: ['aidan gomez'] },
  perplexity: { company: ['perplexity'], ceo: ['aravind srinivas'] },
  stability: {
    company: ['stability', 'stable diffusion'],
    ceo: ['emad mostaque'],
  },
  xai: { company: ['xai'], ceo: ['elon musk'] },
  openrouter: { company: ['openrouter'], ceo: ['emil'] },
};

function useFetchClusters() {
  const [clusters, setClusters] = useState<StoryClusterView[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch('/api/stories', { signal: ac.signal }).then((x) =>
          x.json()
        );
        if (!ac.signal.aborted) {
          setClusters(r.stories ?? []);
        }
      } catch (e: unknown) {
        const { isAbortError } = await import('@/src/utils/errors');
        if (isAbortError(e)) {
          return;
        }
        // Swallow non-abort errors for now; hook into reporting later.
      }
    })();
    return () => ac.abort('CompanyTab unmounted');
  }, []);

  return clusters;
}

function filterClusters(clusters: StoryClusterView[], slug: string, ceo: string) {
  const keys = COMPANY_KEYWORDS[slug] ?? { company: [slug], ceo: [ceo] };
  const inText = (c: StoryClusterView, arr: string[]) =>
    arr.some((k) => `${c.title} ${c.primaryUrl}`.toLowerCase().includes(k));
  return {
    news: clusters.filter((c) => inText(c, keys.company)),
    ceoNews: clusters.filter((c) => inText(c, keys.ceo)),
  };
}

function selectPrimaryItems(
  isCEOView: boolean,
  ceoNews: StoryClusterView[],
  news: StoryClusterView[],
  clusters: StoryClusterView[]
) {
  if (isCEOView) {
    return ceoNews.length ? ceoNews : clusters;
  }
  return news.length ? news : clusters;
}

function selectSecondaryItems(
  isCEOView: boolean,
  ceoNews: StoryClusterView[],
  news: StoryClusterView[],
  clusters: StoryClusterView[]
) {
  if (isCEOView) {
    return news.length ? news : clusters;
  }
  return ceoNews.length ? ceoNews : clusters;
}

export default function CompanyTab({ tab }: { tab: Tab }) {
  const [view, setView] = useQueryState('view', companyViewParser);
  const name = (tab.context?.company as string) ?? '';
  const slug = (tab.context?.slug as string) ?? '';
  const ceo = (tab.context?.ceo as string) ?? '';
  const domain = (tab.context?.domain as string) ?? '';

  const clusters = useFetchClusters();
  const { news, ceoNews } = useMemo(
    () => filterClusters(clusters, slug, ceo),
    [clusters, slug, ceo]
  );

  const ITEMS_PER_SECTION = 6;
  const isCEOView = view === 'ceo';
  const primaryTitle = isCEOView ? `CEO — ${ceo}` : 'Recent news';
  const secondaryTitle = isCEOView ? 'Recent news' : `CEO — ${ceo}`;
  const primaryItems = selectPrimaryItems(
    isCEOView,
    ceoNews,
    news,
    clusters
  ).slice(0, ITEMS_PER_SECTION);
  const secondaryItems = selectSecondaryItems(
    isCEOView,
    ceoNews,
    news,
    clusters
  ).slice(0, ITEMS_PER_SECTION);

  return (
    <div className="h-full overflow-auto">
      <CompanyHeader
        domain={domain}
        name={name}
        setView={setView}
        view={view}
      />
      <CompanySections
        primaryItems={primaryItems}
        primaryTitle={primaryTitle}
        secondaryItems={secondaryItems}
        secondaryTitle={secondaryTitle}
      />
    </div>
  );
}

function CompanyHeader({
  domain,
  name,
  view,
  setView,
}: {
  domain: string;
  name: string;
  view: 'news' | 'ceo' | null;
  setView: (
    v: 'news' | 'ceo' | ((old: 'news' | 'ceo') => 'news' | 'ceo' | null) | null
  ) => Promise<URLSearchParams>;
}) {
  return (
    <div className="flex items-center gap-2 border-b bg-background/50 p-3 font-medium text-sm">
      {domain ? (
        <Image
          alt=""
          className="h-5 w-5 rounded"
          height={20}
          src={`https://logo.clearbit.com/${domain}`}
          width={20}
        />
      ) : null}
      <span>Company › {name}</span>
      <div className="ml-auto flex items-center gap-1 text-xs">
        <button
          className={`rounded px-2 py-1 ${view === 'news' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
          onClick={async () => {
            await setView('news');
          }}
          type="button"
        >
          News
        </button>
        <button
          className={`rounded px-2 py-1 ${view === 'ceo' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
          onClick={async () => {
            await setView('ceo');
          }}
          type="button"
        >
          CEO
        </button>
      </div>
    </div>
  );
}

function CompanySections({
  primaryTitle,
  secondaryTitle,
  primaryItems,
  secondaryItems,
}: {
  primaryTitle: string;
  secondaryTitle: string;
  primaryItems: StoryClusterView[];
  secondaryItems: StoryClusterView[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-2">
      <section>
        <h3 className="mb-2 font-semibold text-sm">{primaryTitle}</h3>
        <div className="divide-y rounded-md border bg-white">
          {primaryItems.map((c) => (
            <StoryRow cluster={c} key={c.id} />
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-2 font-semibold text-sm">{secondaryTitle}</h3>
        <div className="divide-y rounded-md border bg-white">
          {secondaryItems.map((c) => (
            <StoryRow cluster={c} key={c.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
