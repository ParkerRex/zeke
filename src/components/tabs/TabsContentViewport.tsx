'use client';
import { useTabs } from '@/lib/tabsStore';
import StoryTab from './StoryTab';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import StoriesGridClient from '@/components/stories/StoriesGridClient';

export default function TabsContentViewport() {
  const { tabs, activeId, setActive } = useTabs();
  const pathname = usePathname();
  const active = tabs.find((t) => t.id === activeId);
  // If the URL is /stories/[id], ensure the matching tab is active once loaded
  useEffect(() => {
    const m = pathname?.match(/^\/stories\/(.+)$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (id && activeId !== id) {
      const exists = tabs.find((t) => t.id === id);
      if (exists) setActive(id);
    }
  }, [pathname, tabs, activeId, setActive]);
  if (!active) {
    if (pathname === '/stories') return <StoriesGridClient variant='full' />;
    return <div className='p-6 text-muted-foreground'>Open a story to begin.</div>;
  }
  return (
    <div role='tabpanel' id={`tabpanel-${active.id}`} aria-labelledby={`tab-${active.id}`} className='h-full'>
      <StoryTab tab={active} />
    </div>
  );
}
