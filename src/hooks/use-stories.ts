"use client";
import { useEffect, useRef, useState } from "react";
import type { Cluster } from "@/types/stories";

// Simple in-memory cache for stories
type CacheEntry = { clusters: Cluster[]; at: number } | null;
let cache: CacheEntry = null;
const CACHE_TTL_MS = 30_000; // 30s basic caching

export function useStories() {
  const [clusters, setClusters] = useState<Cluster[]>(cache?.clusters ?? []);
  const [loading, setLoading] = useState<boolean>(!cache);
  const [error, setError] = useState<string | null>(null);
  const reloadKeyRef = useRef(0);

  const load = () => {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) {
      setClusters(cache.clusters);
      setLoading(false);
      setError(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch("/api/stories", { signal: ac.signal })
      .then((r) => r.json())
      .then((json) => {
        const data = (json?.clusters as Cluster[] | undefined) ?? [];
        cache = { clusters: data, at: Date.now() };
        setClusters(data);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        // eslint-disable-next-line no-console
        console.error(e);
        setError("Failed to load stories");
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort("useStories unmounted");
  };

  useEffect(() => {
    const cleanup = load();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKeyRef.current]);

  const reload = () => {
    cache = null; // bust cache and trigger refetch
    reloadKeyRef.current++;
    // Trigger effect by forcing a state update
    setLoading(true);
    setError(null);
    // queue microtask so effect sees updated ref
    Promise.resolve().then(() => setLoading((v) => v));
  };

  return { clusters, loading, error, reload };
}
