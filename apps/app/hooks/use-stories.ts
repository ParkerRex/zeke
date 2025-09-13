"use client";
import { useCallback, useEffect, useState } from "react";
import type { Cluster } from "@zeke/supabase/types";
import { isAbortError, safeErrorMessage } from "@/utils/errors";

// Simple in-memory cache for stories
type CacheEntry = { clusters: Cluster[]; at: number } | null;
let cache: CacheEntry = null;
const CACHE_TTL_MS = 30_000; // 30s basic caching

export function useStories() {
  const [clusters, setClusters] = useState<Cluster[]>(cache?.clusters ?? []);
  const [loading, setLoading] = useState<boolean>(!cache);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback((signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    fetch("/api/stories", { signal })
      .then((r) => r.json())
      .then((json) => {
        const data = (json?.clusters as Cluster[] | undefined) ?? [];
        cache = { clusters: data, at: Date.now() };
        setClusters(data);
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
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) {
      setClusters(cache.clusters);
      setLoading(false);
      setError(null);
      return;
    }
    const ac = new AbortController();
    fetchStories(ac.signal);
    return () => ac.abort("useStories unmounted");
  }, [fetchStories]);

  const reload = useCallback(() => {
    cache = null; // bust cache
    const ac = new AbortController();
    fetchStories(ac.signal);
  }, [fetchStories]);

  return { clusters, loading, error, reload };
}
