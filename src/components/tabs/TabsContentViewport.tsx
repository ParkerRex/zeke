'use client';
import { useTabs } from '@/lib/tabsStore';
import StoryTab from './StoryTab';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import StoriesGridClient from '@/components/stories/StoriesGridClient';
import { STRINGS } from '@/constants/strings';

export default function TabsContentViewport() {
  const { tabs, activeId, setActive } = useTabs();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    return <div className='p-6 text-muted-foreground'>{STRINGS.openAStory}</div>;
  }

  // Keep URL in sync with active tab (stories)
  useEffect(() => {
    if (!active) return;
    if (active.clusterId) {
      const target = `/stories/${encodeURIComponent(active.clusterId)}`;
      if (pathname !== target) router.replace(target);
    }
  }, [active, pathname, router]);

  // One-time hydration from URL: open tabs from ?tabs=id1,id2,.. and set active from ?active=id
  useEffect(() => {
    const param = searchParams?.get('tabs');
    if (!param) return;
    const ids = Array.from(new Set(param.split(',').map((s) => s.trim()).filter(Boolean))).slice(0, 8);
    if (!ids.length) return;
    // Open sequentially to avoid thundering herd
    (async () => {
      for (const id of ids) {
        try {
          await useTabs.getState().restoreFromUrl(id, false);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('hydrate_tabs_error', e);
        }
      }
      const act = searchParams?.get('active');
      const target = act && ids.includes(act) ? act : ids[0];
      if (target) setActive(target);
    })();
    // Run only on first client render for this param snapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div role='tabpanel' id={`tabpanel-${active.id}`} aria-labelledby={`tab-${active.id}`} className='h-full'>
      <StoryTab tab={active} />
    </div>
  );
}
