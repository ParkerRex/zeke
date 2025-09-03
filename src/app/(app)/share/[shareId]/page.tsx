'use client';
import { useEffect } from 'react';

import { useTabs } from '@/lib/tabsStore';
export default function ShareRoute({ params }: { params: { shareId: string } }) {
  const { restoreFromUrl, setActive } = useTabs();
  const id = params.shareId;

  useEffect(() => {
    let mounted = true;
    (async () => {
      await restoreFromUrl(id, true);
      if (mounted) setActive(`share:${id}`);
    })();
    return () => {
      mounted = false;
    };
  }, [id, restoreFromUrl, setActive]);

  return null;
}
