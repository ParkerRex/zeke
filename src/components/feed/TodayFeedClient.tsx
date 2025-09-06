"use client";
import { useEffect, useState } from 'react';

import StoryRow from '@/components/feed/StoryRow';
import type { Cluster } from '@/types/stories';
import { useStories } from '@/hooks/use-stories';
import { STRINGS } from '@/constants/strings';

export default function TodayFeedClient() {
  const { clusters, loading, error, reload } = useStories();

  return (
    <div>
      <div className='border-b bg-background/50 p-3 text-sm font-medium'>Today's Top Stories</div>
      {loading ? (
        <div className='p-3 text-sm text-muted-foreground'>{STRINGS.loading}</div>
      ) : error ? (
        <div className='flex items-center justify-between p-3 text-sm'>
          <span className='text-red-600'>{error || STRINGS.loadError}</span>
          <button
            type='button'
            className='rounded bg-gray-900 px-3 py-1 text-white hover:opacity-90'
            onClick={reload}
          >
            {STRINGS.retry}
          </button>
        </div>
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
