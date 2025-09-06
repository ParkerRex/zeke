"use client";
import { useEffect } from 'react';
import { useTabs } from '@/lib/tabsStore';
import { getCompanyMetaBySlug } from '@/data/company';

export default function CompanyHydrator({ slug }: { slug: string }) {
  const { tabs, openTab, updateContext, setActive } = useTabs();
  useEffect(() => {
    const meta = getCompanyMetaBySlug(slug);
    const ctx = meta
      ? { company: meta.name, slug: meta.slug, ceo: meta.ceo, domain: meta.domain }
      : { company: slug, slug };
    const exists = tabs.find((t) => t.id === 'tab:company');
    if (!exists) {
      openTab({
        id: 'tab:company',
        title: 'Company',
        embedKind: 'company',
        embedUrl: '',
        overlays: { whyItMatters: '', chili: 0, confidence: 0, sources: [] },
        context: ctx,
      });
    } else {
      updateContext('tab:company', ctx);
      setActive('tab:company');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  return null;
}
