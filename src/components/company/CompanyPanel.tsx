'use client';
import { useMemo } from 'react';

import { useTabs } from '@/lib/tabsStore';

const COMPANIES: { name: string; slug: string; ceo: string; domain: string }[] = [
  { name: 'OpenAI', slug: 'openai', ceo: 'Sam Altman', domain: 'openai.com' },
  { name: 'Anthropic', slug: 'anthropic', ceo: 'Dario Amodei', domain: 'anthropic.com' },
  { name: 'Google DeepMind', slug: 'deepmind', ceo: 'Demis Hassabis', domain: 'deepmind.com' },
  { name: 'Meta AI', slug: 'meta', ceo: 'Mark Zuckerberg', domain: 'meta.com' },
  { name: 'Mistral AI', slug: 'mistral', ceo: 'Arthur Mensch', domain: 'mistral.ai' },
  { name: 'Cohere', slug: 'cohere', ceo: 'Aidan Gomez', domain: 'cohere.com' },
  { name: 'Perplexity', slug: 'perplexity', ceo: 'Aravind Srinivas', domain: 'perplexity.ai' },
  { name: 'Stability AI', slug: 'stability', ceo: 'Emad Mostaque', domain: 'stability.ai' },
  { name: 'xAI', slug: 'xai', ceo: 'Elon Musk', domain: 'x.ai' },
  { name: 'OpenRouter', slug: 'openrouter', ceo: 'Emil', domain: 'openrouter.ai' },
];

export default function CompanyPanel() {
  const { tabs, openTab, setActive, updateContext } = useTabs();
  const companyTab = useMemo(() => tabs.find((t) => t.id === 'tab:company'), [tabs]);

  const openCompany = (slug: string) => {
    const meta = COMPANIES.find((c) => c.slug === slug)!;
    if (!companyTab) {
      openTab({
        id: 'tab:company',
        title: 'Company',
        embedKind: 'company' as any,
        embedUrl: '',
        overlays: { whyItMatters: '', chili: 0, confidence: 0, sources: [] },
        context: { company: meta.name, slug: meta.slug, ceo: meta.ceo, domain: meta.domain },
      });
      return;
    }
    updateContext('tab:company', { company: meta.name, slug: meta.slug, ceo: meta.ceo, domain: meta.domain });
    setActive('tab:company');
  };

  return (
    <div>
      <div className='border-b bg-background/50 p-4 text-sm font-medium'>Companies</div>
      <ul className='p-2'>
        {COMPANIES.map((c) => (
          <li key={c.slug}>
            <button
              onClick={() => openCompany(c.slug)}
              className='flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-50'
            >
              <img
                alt=''
                className='h-6 w-6 rounded'
                src={`https://logo.clearbit.com/${c.domain}`}
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = 'none';
                }}
              />
              <div className='min-w-0'>
                <div className='truncate font-medium text-gray-900'>{c.name}</div>
                <div className='truncate text-xs text-gray-500'>CEO: {c.ceo}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
