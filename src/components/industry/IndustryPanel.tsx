"use client";
import { useMemo } from 'react';

import { useTabs } from '@/lib/tabsStore';

type Node = {
  name: string;
  children?: string[];
};

const DATA: Node[] = [
  { name: 'Marketing', children: ['Performance', 'Brand', 'Content', 'SEO', 'Growth'] },
  { name: 'Design', children: ['Product Design', 'UX Research', 'Visual / Branding', 'Motion'] },
  { name: 'Creative', children: ['Video', 'Editing', 'Copywriting', 'Illustration'] },
  { name: 'Software Development', children: ['Web', 'Mobile', 'Data/ML', 'Infrastructure', 'Hardware'] },
  { name: 'AI/ML Tools', children: ['Agents', 'LLMOps', 'Vector DBs', 'Eval/Benchmarking'] },
  { name: 'Research', children: ['NLP', 'Vision', 'Robotics', 'Reinforcement Learning'] },
];

export default function IndustryPanel() {
  const { tabs, openTab, setActive, updateContext } = useTabs();
  const industryTab = useMemo(() => tabs.find((t) => t.id === 'industries'), [tabs]);

  const openIndustry = (industry: string, sub?: string) => {
    if (!industryTab) {
      openTab({
        id: 'industries',
        title: 'Industries',
        embedKind: 'industry' as any,
        embedUrl: '',
        overlays: { whyItMatters: '', chili: 0, confidence: 0, sources: [] },
        context: { industry, subindustry: sub },
      });
      return;
    }
    updateContext('industries', { industry, subindustry: sub });
    setActive('industries');
  };

  return (
    <div>
      <div className='border-b bg-background/50 p-4 backdrop-blur'>Industries</div>
      <div className='space-y-4 p-4'>
        {DATA.map((n) => (
          <div key={n.name}>
            <button
              onClick={() => openIndustry(n.name)}
              className='mb-2 w-full rounded-md border bg-white px-3 py-2 text-left text-sm font-medium hover:border-gray-300 hover:bg-gray-50'
            >
              {n.name}
            </button>
            <div className='ml-2 grid grid-cols-2 gap-1'>
              {n.children?.map((c) => (
                <button
                  key={c}
                  onClick={() => openIndustry(n.name, c)}
                  className='rounded-md border bg-white px-2 py-1 text-left text-xs hover:border-gray-300 hover:bg-gray-50'
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

