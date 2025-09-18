'use client';
import { isAbortError, safeErrorMessage } from '@/src/utils/errors';
import type { StoryClusterView } from '@/lib/stories';
import { useCallback, useEffect, useState } from 'react';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface StoriesFilter {
  limit?: number;
  offset?: number;
  kind?: 'all' | 'youtube' | 'arxiv' | 'podcast' | 'reddit' | 'hn' | 'article';
  q?: string;
}

export interface StoriesResponse {
  stories: StoryClusterView[];
  pagination: {
    limit: number;
    offset: number;
    totalCount: number;
    hasMore: boolean;
  };
}

interface CacheEntry {
  data: StoriesResponse;
  at: number;
  key: string;
}

const cache: Map<string, CacheEntry> = new Map();

function getCacheKey(filter: StoriesFilter): string {
  return JSON.stringify(filter);
}

export function useStories(filter: StoriesFilter = {}) {
  const cacheKey = getCacheKey(filter);
  const cachedEntry = cache.get(cacheKey);

  const [data, setData] = useState<StoriesResponse | null>(
    cachedEntry?.data ?? null
  );
  const [loading, setLoading] = useState<boolean>(!cachedEntry);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(
    (signal: AbortSignal, currentFilter: StoriesFilter) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (currentFilter.limit) {
        params.set('limit', currentFilter.limit.toString());
      }
      if (currentFilter.offset) {
        params.set('offset', currentFilter.offset.toString());
      }
      if (currentFilter.kind && currentFilter.kind !== 'all') {
        params.set('kind', currentFilter.kind);
      }
      if (currentFilter.q) {
        params.set('q', currentFilter.q);
      }

      const url = `/api/stories${params.toString() ? `?${params.toString()}` : ''}`;

      fetch(url, { signal })
        .then((r) => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.json();
        })
        .then((response: StoriesResponse) => {
          const key = getCacheKey(currentFilter);
          cache.set(key, { data: response, at: Date.now(), key });
          setData(response);
        })
        .catch((e: unknown) => {
          if (isAbortError(e)) {
            return;
          }
          setError(safeErrorMessage(e));
        })
        .finally(() => {
          if (!signal.aborted) {
            setLoading(false);
          }
        });
    },
    []
  );

  useEffect(() => {
    const now = Date.now();
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && now - cachedEntry.at < CACHE_TTL_MS) {
      setData(cachedEntry.data);
      setLoading(false);
      setError(null);
      return;
    }

    const ac = new AbortController();
    fetchStories(ac.signal, filter);
    return () => ac.abort('useStories unmounted');
  }, [fetchStories, cacheKey, filter]);

  const reload = useCallback(() => {
    cache.delete(cacheKey); // bust cache for this filter
    const ac = new AbortController();
    fetchStories(ac.signal, filter);
  }, [fetchStories, cacheKey, filter]);

  const loadMore = useCallback(() => {
    if (!data || !data.pagination.hasMore || loading) {
      return;
    }

    const nextFilter = {
      ...filter,
      offset: (filter.offset ?? 0) + (filter.limit ?? 20),
    };

    const ac = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (nextFilter.limit) {
      params.set('limit', nextFilter.limit.toString());
    }
    if (nextFilter.offset) {
      params.set('offset', nextFilter.offset.toString());
    }
    if (nextFilter.kind && nextFilter.kind !== 'all') {
      params.set('kind', nextFilter.kind);
    }
    if (nextFilter.q) {
      params.set('q', nextFilter.q);
    }

    const url = `/api/stories${params.toString() ? `?${params.toString()}` : ''}`;

    fetch(url, { signal: ac.signal })
      .then((r) => r.json())
      .then((response: StoriesResponse) => {
        setData((prev) =>
          prev
            ? {
                stories: [...prev.stories, ...response.stories],
                pagination: response.pagination,
              }
            : response
        );
      })
      .catch((e: unknown) => {
        if (!isAbortError(e)) {
          setError(safeErrorMessage(e));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [data, filter, loading]);

  return {
    stories: data?.stories ?? [],
    clusters: data?.stories ?? [], // Backward compatibility
    pagination: data?.pagination,
    loading,
    error,
    reload,
    loadMore,
  };
}
