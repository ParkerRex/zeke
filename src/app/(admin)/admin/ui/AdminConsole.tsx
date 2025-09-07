"use client";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ForecastPlayground from "./ForecastPlayground";
import { createSupabaseBrowserClient } from "@/libs/supabase/supabase-browser";

type Source = {
  id: string;
  kind: string;
  name: string | null;
  url: string | null;
  domain: string | null;
  active: boolean;
  last_checked: string | null;
  metadata: any;
};

function formatTs(ts: string | null) {
  if (!ts) return "–";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function detectKindFromUrl(url: string): { kind: string; domain?: string } {
  try {
    const u = new URL(url);
    const host = u.hostname || "";
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      return { kind: "youtube_channel", domain: "youtube.com" };
    }
    return { kind: "rss", domain: host || null || undefined } as any;
  } catch {
    return { kind: "rss" };
  }
}

export default function AdminConsole() {
  const [tab, setTab] = useState("sources");
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [qName, setQName] = useState("");
  const [qUrl, setQUrl] = useState("");
  const [qKind, setQKind] = useState<"rss" | "podcast" | "youtube_channel" | "youtube_search">("rss");
  // Overview/Jobs state
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<any | null>(null);
  const [recent, setRecent] = useState<any | null>(null);
  const [jobMetrics, setJobMetrics] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<{ id: string; items: any[]; quota?: any } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [oneoff, setOneoff] = useState<string>("");
  const [oneoffResult, setOneoffResult] = useState<any[] | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sources", { cache: "no-store" });
      const json = await res.json();
      if (json?.sources) setSources(json.sources);
      // Seed metrics map from embedded source_metrics if present
      const m: Record<string, any> = {};
      (json?.sources || []).forEach((s: any) => {
        if (s.source_metrics) m[s.id] = s.source_metrics;
      });
      setMetrics(m);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function tick() {
      try {
        const [s, r] = await Promise.all([
          fetch("/api/pipeline/status", { cache: "no-store" }).then((x) => x.json()),
          fetch("/api/pipeline/recent", { cache: "no-store" }).then((x) => x.json()),
        ]);
        if (mounted) {
          setStatus(s);
          setRecent(r);
        }
      } catch {
        // noop
      }
    }
    void tick();
    const id = setInterval(tick, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // Subscribe to job_metrics and aggregate map
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel('admin-job-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_metrics' }, (payload: any) => {
        const row = (payload.new ?? payload.record) as any;
        if (!row?.name || !row?.state) return;
        setJobMetrics((prev) => ({ ...prev, [`${row.name}:${row.state}`]: row.count }));
      })
      .subscribe();
    // Warm load current metrics snapshot
    (async () => {
      const { data } = await supabase.from('job_metrics').select('*');
      const m: Record<string, number> = {};
      (data || []).forEach((r: any) => { m[`${r.name}:${r.state}`] = r.count; });
      setJobMetrics(m);
    })();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  // Realtime metrics subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel('admin-source-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'source_metrics' }, (payload: any) => {
        const row = (payload.new ?? payload.record) as any;
        if (!row?.source_id) return;
        setMetrics((prev) => ({ ...prev, [row.source_id]: row }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'source_health' }, (payload: any) => {
        const row = (payload.new ?? payload.record) as any;
        if (!row?.source_id) return;
        // Attach health to the matching source object
        setSources((prev) => prev.map((s) => (s.id === row.source_id ? ({ ...s, source_health: row } as any) : s)) as any);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_metrics' }, (_payload: any) => {
        // Overview will fetch job metrics from Realtime by client aggregation; handled in-place below.
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const totalByKind = useMemo(() => {
    const m = new Map<string, number>();
    sources.forEach((s) => m.set(s.kind, (m.get(s.kind) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [sources]);

  async function upsertSource() {
    const body: any = { kind: qKind, name: qName || null, url: qUrl || null };
    if (!qKind && qUrl) {
      const d = detectKindFromUrl(qUrl);
      body.kind = d.kind;
      if (!body.domain && d.domain) body.domain = d.domain;
    }
    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setQName("");
      setQUrl("");
      await load();
    }
  }

  async function action(id: string, op: "pause" | "resume" | "delete") {
    const res = await fetch(`/api/admin/sources/${id}/${op}`, { method: "POST" });
    if (res.ok) await load();
  }

  async function backfill(id: string, days: number) {
    const res = await fetch(`/api/admin/sources/${id}/backfill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    if (res.ok) await load();
  }

  async function trigger(kind: "rss" | "youtube") {
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
  }

  async function doPreview(id: string) {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/admin/sources/${id}/preview?limit=10`, { cache: "no-store" });
      const json = await res.json();
      if (json?.ok) setPreview({ id, items: json.items || [], quota: json.quota || null });
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="text-xl font-semibold tracking-tight">Admin Console</h1>
      <p className="mt-1 text-[13px] leading-snug text-muted-foreground">Manage sources, monitor jobs, estimate costs.</p>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Source</CardTitle>
              <CardDescription>Paste any URL (YouTube/channel, RSS feed) or enter a name.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input placeholder="Name (optional)" value={qName} onChange={(e) => setQName(e.target.value)} />
                <Input placeholder="URL (https://...)" value={qUrl} onChange={(e) => setQUrl(e.target.value)} />
                <select
                  className="h-9 rounded-md border px-2 text-sm"
                  value={qKind}
                  onChange={(e) => setQKind(e.target.value as any)}
                >
                  <option value="rss">RSS</option>
                  <option value="podcast">Podcast</option>
                  <option value="youtube_channel">YouTube Channel</option>
                  <option value="youtube_search">YouTube Search</option>
                </select>
                <Button onClick={upsertSource} disabled={loading}>Add</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>One-off Ingest</CardTitle>
              <CardDescription>Paste one or more URLs (one per line). We’ll detect type and ingest once.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <textarea className="min-h-[140px] w-full rounded-md border bg-white p-3 text-sm" placeholder="https://youtu.be/VIDEO_ID\nhttps://blog.com/post...\nhttps://podcast.example/episode.mp3" value={oneoff} onChange={(e) => setOneoff(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={async () => {
                    const urls = oneoff.split(/\n|\r/).map((x) => x.trim()).filter(Boolean);
                    if (!urls.length) return;
                    const res = await fetch('/api/admin/ingest/oneoff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls }) });
                    const json = await res.json();
                    setOneoffResult(json?.results || []);
                  }}>Ingest URLs</Button>
                  {oneoffResult && <div className="text-xs text-muted-foreground self-center">{oneoffResult.filter((r: any) => r.ok).length} enqueued, {oneoffResult.filter((r: any) => !r.ok).length} skipped</div>}
                </div>
                {oneoffResult && oneoffResult.length > 0 && (
                  <div className="max-h-56 overflow-auto text-sm">
                    <ul className="space-y-1.5">
                      {oneoffResult.map((r: any, idx: number) => (
                        <li key={idx} className="border px-3 py-2">
                          <div className="truncate leading-tight">{r.url}</div>
                          <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{r.type ?? 'unknown'} • {r.ok ? 'enqueued' : `skipped (${r.error || 'error'})`}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
              <CardDescription>Active sources by kind; pause/resume and edit.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {totalByKind.map(([k, v]) => (
                  <Badge key={k} variant="secondary">{k}: {v}</Badge>
                ))}
              </div>
              <div className="max-h-[540px] overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Kind</th>
                      <th className="py-2 pr-3">Domain</th>
                      <th className="py-2 pr-3">Counts</th>
                      <th className="py-2 pr-3">Last Check</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="py-2 pr-3 max-w-[280px] truncate">
                          <div className="font-medium truncate">{s.name || s.url || s.id}</div>
                          <div className="text-[12px] text-muted-foreground truncate">{s.url || s.domain || '—'}</div>
                        </td>
                        <td className="py-2 pr-3">{s.kind}</td>
                        <td className="py-2 pr-3">{s.domain || '—'}</td>
                        <td className="py-2 pr-3">
                          {(() => {
                            const m = metrics[s.id];
                            if (!m) return '—';
                            return (
                              <span className="text-xs text-muted-foreground">
                                Raw {m.raw_total ?? 0} / Cont {m.contents_total ?? 0} / St {m.stories_total ?? 0}
                                {typeof m.stories_24h === 'number' && m.stories_24h > 0 && (
                                  <span className="ml-2 text-emerald-600">+{m.stories_24h} (24h)</span>
                                )}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-2 pr-3">{formatTs(s.last_checked)}</td>
                        <td className="py-2 pr-3">{s.active ? <Badge>Active</Badge> : <Badge variant="secondary">Paused</Badge>}</td>
                        <td className="py-2 pr-3 space-x-2">
                          {s.active ? (
                            <Button size="sm" variant="outline" onClick={() => action(s.id, 'pause')}>Pause</Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => action(s.id, 'resume')}>Resume</Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => action(s.id, 'delete')}>Archive</Button>
                          <span className="inline-flex items-center gap-1">
                            <Button size="sm" variant="secondary" onClick={() => backfill(s.id, 7)}>Backfill 7d</Button>
                            <Button size="sm" variant="secondary" onClick={() => backfill(s.id, 30)}>30d</Button>
                            <Button size="sm" variant="secondary" onClick={() => backfill(s.id, 90)}>90d</Button>
                            <Button size="sm" variant="outline" onClick={() => doPreview(s.id)} disabled={previewLoading && preview?.id === s.id}>Preview</Button>
                            <Button size="sm" variant="default" onClick={async () => { await fetch(`/api/admin/sources/${s.id}/ingest`, { method: 'POST' }); }}>Seed now</Button>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {sources.length === 0 && (
                      <tr>
                        <td className="py-6 text-center text-muted-foreground" colSpan={6}>No sources yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview ({preview.items.length})</CardTitle>
                <CardDescription>Top candidates to ingest. No writes performed.</CardDescription>
              </CardHeader>
              <CardContent>
                {preview.quota && (
                  <div className="mb-3 text-xs text-muted-foreground">Quota used: {preview.quota.used} • Remaining: {preview.quota.remaining}</div>
                )}
                <div className="max-h-80 overflow-auto text-sm">
                  <ul className="space-y-1.5">
                    {preview.items.map((it: any) => (
                      <li key={it.external_id || it.url} className="border px-3 py-2">
                        <div className="truncate leading-tight">{it.title || it.url}</div>
                        <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground truncate">{it.url}</div>
                      </li>
                    ))}
                    {preview.items.length === 0 && (
                      <div className="text-sm text-muted-foreground">No items.</div>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Pipeline Diagnostics</h2>
              <p className="mt-1 text-[13px] leading-snug text-muted-foreground">Live status updates every 2s. Use actions to manually kick off ingest.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => trigger('rss')} disabled={busy}>Trigger RSS Ingest</Button>
              <Button variant="secondary" onClick={() => trigger('youtube')} disabled={busy}>Trigger YouTube Ingest</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>High-level counts across the ingestion funnel.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
                  <div className="border px-3 py-2.5"><div className="text-[13px] text-muted-foreground">Sources (RSS)</div><div className="mt-0.5 text-lg font-semibold">{status?.worker?.sources?.sources_rss ?? '–'}</div></div>
                  <div className="border px-3 py-2.5"><div className="text-[13px] text-muted-foreground">Raw Items</div><div className="mt-0.5 text-lg font-semibold">{status?.worker?.raw?.raw_total ?? status?.counts?.raw_items ?? '–'}</div></div>
                  <div className="border px-3 py-2.5"><div className="text-[13px] text-muted-foreground">Contents</div><div className="mt-0.5 text-lg font-semibold">{status?.worker?.contents?.contents_total ?? status?.counts?.contents ?? '–'}</div></div>
                  <div className="border px-3 py-2.5"><div className="text-[13px] text-muted-foreground">Stories</div><div className="mt-0.5 text-lg font-semibold">{status?.counts?.stories ?? '–'}</div></div>
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
                  {status?.worker?.ok ? <Badge>Connected</Badge> : <Badge variant="destructive">Not detected</Badge>}
                </div>
                <div><span className="text-muted-foreground">Port:</span> {status?.worker?.port ?? 'n/a'}</div>
                <div className="text-muted-foreground">Last updated: {status?.ts ? new Date(status.ts).toLocaleTimeString() : '–'}</div>
              </CardContent>
            </Card>
            <QuotaCard />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Job Queue</CardTitle>
              <CardDescription>Top job/state counts from the worker.</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const entries = Object.entries(jobMetrics);
                const items = entries.sort((a, b) => b[1] - a[1]).slice(0, 8);
                if (items.length === 0) return <div className="text-sm text-muted-foreground">No jobs reported.</div>;
                return (
                  <ul className="space-y-1.5 text-sm">
                    {items.map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between border px-3 py-2">
                        <span className="truncate pr-4">{k}</span>
                        <span className="font-mono">{v}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
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
                    {(recent?.raw_items ?? []).map((r: any) => (
                      <li key={r.id} className="border px-3 py-2">
                        <div className="truncate leading-tight">{r.title ?? r.url ?? r.id}</div>
                        <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{new Date(r.discovered_at).toLocaleString()} • {r.kind ?? 'article'}</div>
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
                    {(recent?.contents ?? []).map((c: any) => (
                      <li key={c.id} className="border px-3 py-2">
                        <div className="truncate leading-tight">{c.html_url ?? c.id}</div>
                        <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{new Date(c.created_at).toLocaleString()} • raw {String(c.raw_item_id).slice(0,8)}</div>
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
                    {(recent?.stories ?? []).map((s: any) => (
                      <li key={s.id} className="border px-3 py-2">
                        <div className="truncate leading-tight">{s.title ?? s.canonical_url ?? s.primary_url ?? s.id}</div>
                        <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{new Date(s.created_at).toLocaleString()} • {s.kind ?? 'article'}</div>
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
        </TabsContent>

        <TabsContent value="forecast" className="mt-4">
          <ForecastPlayground />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Jobs</CardTitle><CardDescription>Job queue is summarized in Overview above.</CardDescription></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Use Overview for live queue + recent lists.</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuotaCard() {
  const [quota, setQuota] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    // initial load
    supabase.from('platform_quota').select('*').then(({ data }) => setQuota(data || []));
    const channel = supabase.channel('admin-quota')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_quota' }, (payload: any) => {
        const row = (payload.new ?? payload.record) as any;
        setQuota((prev) => {
          const map = new Map(prev.map((r) => [r.provider, r]));
          map.set(row.provider, row);
          return Array.from(map.values());
        });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  if (!quota || quota.length === 0) return (
    <Card>
      <CardHeader><CardTitle>Quota</CardTitle><CardDescription>Platform usage</CardDescription></CardHeader>
      <CardContent className="text-sm text-muted-foreground">No quota data.</CardContent>
    </Card>
  );
  return (
    <Card>
      <CardHeader><CardTitle>Quota</CardTitle><CardDescription>Platform usage</CardDescription></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {quota.map((q) => (
          <div key={q.provider} className="flex items-center justify-between border px-3 py-2">
            <div className="truncate pr-4"><span className="font-medium">{q.provider}</span></div>
            <div className="text-right">
              <div>Used {q.used ?? '–'} / {q.quota_limit ?? '–'}</div>
              <div className="text-xs text-muted-foreground">Remaining {q.remaining ?? '–'} • Reset {q.reset_at ? new Date(q.reset_at).toLocaleString() : '–'}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
