'use client';
import { useEffect } from 'react';

import { useTabs } from '@/lib/tabsStore';

export default function StoryClient({ id }: { id: string }) {
  const { restoreFromUrl, setActive } = useTabs();

  useEffect(() => {
    let mounted = true;
    (async () => {
      await restoreFromUrl(id, false);
      if (mounted) setActive(id);
    })();
    return () => {
      mounted = false;
    };
  }, [id, restoreFromUrl, setActive]);

  return null;
}
