"use client";
import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatCurrency(n: number) {
  if (Number.isNaN(n)) return "$0";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

export default function ForecastPlayground() {
  const [videosPerDay, setVideosPerDay] = useState<number>(10000);
  const [avgMinutesPerVideo, setAvgMinutesPerVideo] = useState<number>(8);
  const [captionCoveragePct, setCaptionCoveragePct] = useState<number>(60);
  const [apiSharePct, setApiSharePct] = useState<number>(40);
  const [daysPerMonth, setDaysPerMonth] = useState<number>(30);
  const [apiPricePerMin, setApiPricePerMin] = useState<number>(0.006);
  const [orchestratorMonthly, setOrchestratorMonthly] = useState<number>(40);
  const [localThroughputPerInstancePerDay, setLocalThroughputPerInstancePerDay] = useState<number>(6000);
  const [cloudRunMonthly, setCloudRunMonthly] = useState<number>(120);
  const [renderMonthly, setRenderMonthly] = useState<number>(40);
  const [vmMonthly, setVmMonthly] = useState<number>(30);
  const [notes, setNotes] = useState<string>(`Scratch Pad – Worker Strategy\n\nGoals\n- Ship fast; keep costs reasonable; scale later\n- Prefer free YouTube captions where possible\n- Hybrid plan: captions → API/GPU only when needed\n\nAssumptions (adjust on the right)\n- API price: $0.006/min (editable)\n- Local throughput: 6,000 minutes/day/instance (placeholder; measure!)\n- Orchestrator baseline: $40/mo\n\nNext decisions\n- Start on GCP/Render for the worker (simple deploy)\n- Add captions-first extraction\n- Consider GPU transcriber if API costs dominate\n`);

  const derived = useMemo(() => {
    const totalMinutesPerDay = videosPerDay * avgMinutesPerVideo;
    const transcribedNeededMinutesPerDay = totalMinutesPerDay * (1 - clamp(captionCoveragePct, 0, 100) / 100);
    const apiMinutesPerDay = transcribedNeededMinutesPerDay * (clamp(apiSharePct, 0, 100) / 100);
    const localMinutesPerDay = Math.max(0, transcribedNeededMinutesPerDay - apiMinutesPerDay);
    const monthlyMultiplier = daysPerMonth > 0 ? daysPerMonth : 30;
    const apiDailyCost = apiMinutesPerDay * apiPricePerMin;
    const apiMonthlyCost = apiDailyCost * monthlyMultiplier + orchestratorMonthly;
    const instances = localThroughputPerInstancePerDay > 0 ? Math.ceil(localMinutesPerDay / localThroughputPerInstancePerDay) : 0;
    const cost = (m: number) => ({ instances, monthly: m + orchestratorMonthly, daily: (m + orchestratorMonthly) / monthlyMultiplier });
    return {
      totalMinutesPerDay,
      transcribedNeededMinutesPerDay,
      apiMinutesPerDay,
      localMinutesPerDay,
      apiDailyCost,
      apiMonthlyCost,
      cloudRun: cost(instances * cloudRunMonthly),
      render: cost(instances * renderMonthly),
      vm: cost(instances * vmMonthly),
    };
  }, [videosPerDay, avgMinutesPerVideo, captionCoveragePct, apiSharePct, daysPerMonth, apiPricePerMin, localThroughputPerInstancePerDay, cloudRunMonthly, renderMonthly, vmMonthly, orchestratorMonthly]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Research Notes</h2>
          <span className="text-xs text-muted-foreground">Autosave in memory</span>
        </div>
        <textarea className="min-h-[420px] w-full rounded-md border bg-white p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-gray-200" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </section>
      <section className="rounded-lg border bg-white p-4 space-y-6">
        <div>
          <h2 className="font-medium mb-3">Scenario</h2>
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="videosPerDay">YouTube videos per day</Label>
              <Input id="videosPerDay" type="number" className="w-28" value={videosPerDay} onChange={(e) => setVideosPerDay(clamp(Number(e.target.value || 0), 0, 20000))} />
            </div>
            <Slider min={0} max={20000} step={100} value={[videosPerDay]} onValueChange={([v]) => setVideosPerDay(v)} />
          </div>
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="avgMinutes">Avg minutes per video</Label>
              <Input id="avgMinutes" type="number" className="w-28" value={avgMinutesPerVideo} onChange={(e) => setAvgMinutesPerVideo(clamp(Number(e.target.value || 0), 0, 120))} />
            </div>
            <Slider min={0} max={120} step={1} value={[avgMinutesPerVideo]} onValueChange={([v]) => setAvgMinutesPerVideo(v)} />
          </div>
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="captionCoverage">Caption coverage (%)</Label>
              <Input id="captionCoverage" type="number" className="w-28" value={captionCoveragePct} onChange={(e) => setCaptionCoveragePct(clamp(Number(e.target.value || 0), 0, 100))} />
            </div>
            <Slider min={0} max={100} step={1} value={[captionCoveragePct]} onValueChange={([v]) => setCaptionCoveragePct(v)} />
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="apiShare">API share of remaining (%)</Label>
              <Input id="apiShare" type="number" className="w-28" value={apiSharePct} onChange={(e) => setApiSharePct(clamp(Number(e.target.value || 0), 0, 100))} />
            </div>
            <Slider min={0} max={100} step={1} value={[apiSharePct]} onValueChange={([v]) => setApiSharePct(v)} />
          </div>
          <div className="flex items-center justify-end gap-4 mt-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="daysPerMonth">Days/month</Label>
              <Input id="daysPerMonth" type="number" className="w-20" value={daysPerMonth} onChange={(e) => setDaysPerMonth(clamp(Number(e.target.value || 0), 1, 31))} />
            </div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h2 className="font-medium mb-3">Pricing Assumptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="apiPrice">API $/minute</Label><Input id="apiPrice" type="number" step="0.001" value={apiPricePerMin} onChange={(e) => setApiPricePerMin(Math.max(0, Number(e.target.value || 0)))} /></div>
            <div className="space-y-2"><Label htmlFor="orchestratorMonthly">Orchestrator $/month</Label><Input id="orchestratorMonthly" type="number" step="1" value={orchestratorMonthly} onChange={(e) => setOrchestratorMonthly(Math.max(0, Number(e.target.value || 0)))} /></div>
            <div className="space-y-2"><Label htmlFor="throughput">Local throughput (minutes/day/instance)</Label><Input id="throughput" type="number" step="50" value={localThroughputPerInstancePerDay} onChange={(e) => setLocalThroughputPerInstancePerDay(Math.max(0, Number(e.target.value || 0)))} /></div>
            <div className="space-y-2"><Label htmlFor="cloudRunMonthly">Cloud Run $/month/instance</Label><Input id="cloudRunMonthly" type="number" step="1" value={cloudRunMonthly} onChange={(e) => setCloudRunMonthly(Math.max(0, Number(e.target.value || 0)))} /></div>
            <div className="space-y-2"><Label htmlFor="renderMonthly">Render $/month/instance</Label><Input id="renderMonthly" type="number" step="1" value={renderMonthly} onChange={(e) => setRenderMonthly(Math.max(0, Number(e.target.value || 0)))} /></div>
            <div className="space-y-2"><Label htmlFor="vmMonthly">VM $/month/instance</Label><Input id="vmMonthly" type="number" step="1" value={vmMonthly} onChange={(e) => setVmMonthly(Math.max(0, Number(e.target.value || 0)))} /></div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h2 className="font-medium mb-3">Derived</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3"><div className="text-muted-foreground">Total minutes/day</div><div className="text-lg font-medium">{derived.totalMinutesPerDay.toLocaleString()}</div></div>
            <div className="rounded-md border p-3"><div className="text-muted-foreground">Needs transcription/day</div><div className="text-lg font-medium">{derived.transcribedNeededMinutesPerDay.toLocaleString()}</div></div>
            <div className="rounded-md border p-3"><div className="text-muted-foreground">API minutes/day</div><div className="text-lg font-medium">{derived.apiMinutesPerDay.toLocaleString()}</div></div>
            <div className="rounded-md border p-3"><div className="text-muted-foreground">Local minutes/day</div><div className="text-lg font-medium">{derived.localMinutesPerDay.toLocaleString()}</div></div>
          </div>
        </div>
        <div className="border-t pt-4">
          <h2 className="font-medium mb-3">Cost Estimates (Daily / Monthly)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border p-3"><div className="mb-1 font-medium">API Only</div><div className="text-muted-foreground">Daily</div><div className="text-lg">{formatCurrency(derived.apiDailyCost)}</div><div className="text-muted-foreground mt-2">Monthly (incl. orchestrator)</div><div className="text-lg">{formatCurrency(derived.apiMonthlyCost)}</div></div>
            <div className="rounded-md border p-3"><div className="mb-1 font-medium">Cloud Run (local)</div><div className="text-muted-foreground">Instances needed</div><div className="text-lg">{derived.cloudRun.instances}</div><div className="text-muted-foreground mt-2">Daily</div><div className="text-lg">{formatCurrency(derived.cloudRun.daily)}</div><div className="text-muted-foreground mt-2">Monthly (incl. orchestrator)</div><div className="text-lg">{formatCurrency(derived.cloudRun.monthly)}</div></div>
            <div className="rounded-md border p-3"><div className="mb-1 font-medium">Render (local)</div><div className="text-muted-foreground">Instances needed</div><div className="text-lg">{derived.render.instances}</div><div className="text-muted-foreground mt-2">Daily</div><div className="text-lg">{formatCurrency(derived.render.daily)}</div><div className="text-muted-foreground mt-2">Monthly (incl. orchestrator)</div><div className="text-lg">{formatCurrency(derived.render.monthly)}</div></div>
            <div className="rounded-md border p-3 md:col-span-3"><div className="mb-1 font-medium">VM (local)</div><div className="text-muted-foreground">Instances needed</div><div className="text-lg">{derived.vm.instances}</div><div className="text-muted-foreground mt-2">Daily</div><div className="text-lg">{formatCurrency(derived.vm.daily)}</div><div className="text-muted-foreground mt-2">Monthly (incl. orchestrator)</div><div className="text-lg">{formatCurrency(derived.vm.monthly)}</div></div>
          </div>
        </div>
      </section>
    </div>
  );
}

