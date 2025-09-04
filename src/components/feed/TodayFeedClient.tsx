"use client";
import { useEffect, useState } from 'react';

import StoryRow from '@/components/feed/StoryRow';
import type { Cluster } from '@/features/stories';

export default function TodayFeedClient() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch('/api/stories', { signal: ac.signal })
      .then((res) => res.json())
      .then((json) => setClusters(json.clusters ?? []))
      .catch((e) => {
        if (e.name === 'AbortError') return;
        console.error(e);
        setError('Failed to load stories');
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  return (
    <div>
      <div className='border-b bg-background/50 p-3 text-sm font-medium'>Today's Top Stories</div>
      {loading ? (
        <div className='p-3 text-sm text-muted-foreground'>Loading…</div>
      ) : error ? (
        <div className='p-3 text-sm text-red-600'>{error}</div>
      ) : (
      <div className='divide-y'>
        {clusters.map((c) => (
          <StoryRow key={c.id} cluster={c} />
        ))}
      </div>
      )}
    </div>
  );
}
