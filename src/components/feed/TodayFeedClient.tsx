"use client";
import { useEffect, useState } from 'react';

import StoryRow from '@/components/feed/StoryRow';
import type { Cluster } from '@/features/stories';

export default function TodayFeedClient() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/stories');
        const json = await res.json();
        if (mounted) setClusters(json.clusters ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className='border-b bg-background/50 p-3 text-sm font-medium'>Today's Top Stories</div>
      <div className='divide-y'>
        {clusters.map((c) => (
          <StoryRow key={c.id} cluster={c} />
        ))}
      </div>
    </div>
  );
}
