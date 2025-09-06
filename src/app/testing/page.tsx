"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = {
  ok: boolean;
  ts: string;
  worker: null | {
    ok: boolean;
    port?: string;
    sources?: { sources_rss?: number };
    raw?: { raw_total?: number; raw_24h?: number };
    contents?: { contents_total?: number };
    jobs?: { name: string; state: string; count: number }[];
  };
  counts?: { raw_items: number | null; contents: number | null; stories: number | null };
};

type Recent = {
  ok: boolean;
  ts: string;
  raw_items: { id: string; url: string | null; title: string | null; discovered_at: string; kind: string | null }[];
  contents: { id: string; raw_item_id: string; html_url: string | null; created_at: string; lang: string | null }[];
  stories: { id: string; title: string | null; canonical_url: string | null; primary_url: string | null; created_at: string; kind: string | null }[];
};

function Stat({ label, value }: { label: string; value: number | string | null | undefined }) {
  return (
    <div className="border px-3 py-2.5">
      <div className="text-[13px] leading-snug text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold leading-tight">{value ?? "–"}</div>
    </div>
  );
}

export default function TestingPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [recent, setRecent] = useState<Recent | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [s, r] = await Promise.all([
          fetch("/api/pipeline/status", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/pipeline/recent", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (mounted) {
          setStatus(s);
          setRecent(r);
        }
      } catch (e) {
        // noop
      }
    };
    load();
    const id = setInterval(load, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const jobSummary = useMemo(() => {
    const map = new Map<string, number>();
    (status?.worker?.jobs ?? []).forEach((j) => {
      const key = `${j.name}:${j.state}`;
      map.set(key, (map.get(key) ?? 0) + j.count);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [status]);

  const trigger = async (kind: "rss" | "youtube") => {
    setBusy(true);
    try {
      await fetch("/api/pipeline/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
    } finally {
      setBusy(false);
    }
  };

  const workerConnected = !!status?.worker?.ok;
  const lastUpdated = status?.ts ? new Date(status.ts).toLocaleTimeString() : null;

  const totals = {
    sourcesRss: status?.worker?.sources?.sources_rss ?? null,
    rawItems: status?.worker?.raw?.raw_total ?? status?.counts?.raw_items ?? null,
    contents: status?.worker?.contents?.contents_total ?? status?.counts?.contents ?? null,
    stories: status?.counts?.stories ?? null,
  };

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pipeline Diagnostics</h1>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">Live status updates every 2s. Use actions to manually kick off ingest.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => trigger("rss")} disabled={busy}>
            Trigger RSS Ingest
          </Button>
          <Button variant="secondary" onClick={() => trigger("youtube")} disabled={busy}>
            Trigger YouTube Ingest
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>High-level counts across the ingestion funnel.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Sources (RSS)" value={totals.sourcesRss} />
              <Stat label="Raw Items" value={totals.rawItems} />
              <Stat label="Contents" value={totals.contents} />
              <Stat label="Stories" value={totals.stories} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Worker</CardTitle>
            <CardDescription>Connectivity and heartbeat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              {workerConnected ? (
                <Badge>Connected</Badge>
              ) : (
                <Badge variant="destructive">Not detected</Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Port:</span> {status?.worker?.port ?? "n/a"}
            </div>
            <div className="text-muted-foreground">Last updated: {lastUpdated ?? "–"}</div>

            {!workerConnected && (
              <Alert variant="destructive" className="mt-2">
                <AlertTitle>Worker offline</AlertTitle>
                <AlertDescription>
                  Ensure the Docker worker is running on 8082 (or 8081/8080). Use `pnpm run dev` or
                  `bash scripts/worker-rebuild-run-8082.sh`.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Queue</CardTitle>
          <CardDescription>Top job/state counts from the worker.</CardDescription>
        </CardHeader>
        <CardContent>
          {jobSummary.length === 0 ? (
            <div className="text-sm text-muted-foreground">No jobs reported.</div>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {jobSummary.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between border px-3 py-2">
                  <span className="truncate pr-4">{k}</span>
                  <span className="font-mono">{v}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Raw Items</CardTitle>
            <CardDescription>Newest items discovered from sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto text-sm">
              <ul className="space-y-1.5">
                {(recent?.raw_items ?? []).map((r) => (
                  <li key={r.id} className="border px-3 py-2">
                    <div className="truncate leading-tight">{r.title ?? r.url ?? r.id}</div>
                    <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{new Date(r.discovered_at).toLocaleString()} • {r.kind ?? "article"}</div>
                  </li>
                ))}
                {(recent?.raw_items ?? []).length === 0 && (
                  <div className="text-sm text-muted-foreground">No recent raw items.</div>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Contents</CardTitle>
            <CardDescription>Fetched and parsed contents ready for analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto text-sm">
              <ul className="space-y-1.5">
                {(recent?.contents ?? []).map((c) => (
                  <li key={c.id} className="border px-3 py-2">
                    <div className="truncate leading-tight">{c.html_url ?? c.id}</div>
                    <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{new Date(c.created_at).toLocaleString()} • raw {c.raw_item_id.slice(0, 8)}</div>
                  </li>
                ))}
                {(recent?.contents ?? []).length === 0 && (
                  <div className="text-sm text-muted-foreground">No recent contents.</div>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Stories</CardTitle>
            <CardDescription>Stories created or updated recently.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto text-sm">
              <ul className="space-y-1.5">
                {(recent?.stories ?? []).map((s) => (
                  <li key={s.id} className="border px-3 py-2">
                    <div className="truncate leading-tight">{s.title ?? s.canonical_url ?? s.primary_url ?? s.id}</div>
                    <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{new Date(s.created_at).toLocaleString()} • {s.kind ?? "article"}</div>
                  </li>
                ))}
                {(recent?.stories ?? []).length === 0 && (
                  <div className="text-sm text-muted-foreground">No recent stories.</div>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground">Future: add trace spans (Sentry/OpenTelemetry) to visualize job lifecycles and latencies.</div>
    </div>
  );
}
