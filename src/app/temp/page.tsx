"use client";

import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatCurrency(n: number) {
  if (Number.isNaN(n)) return "$0";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TempPlanningPage() {
  // Core scenario inputs
  const [videosPerDay, setVideosPerDay] = useState<number>(10000);
  const [avgMinutesPerVideo, setAvgMinutesPerVideo] = useState<number>(8);
  const [captionCoveragePct, setCaptionCoveragePct] = useState<number>(60); // percent of videos with usable captions
  const [apiSharePct, setApiSharePct] = useState<number>(40); // percent of non-caption minutes sent to API (hybrid)
  const [daysPerMonth, setDaysPerMonth] = useState<number>(30);

  // Pricing assumptions (editable)
  const [apiPricePerMin, setApiPricePerMin] = useState<number>(0.006); // $/min (e.g., Whisper API ballpark)
  const [orchestratorMonthly, setOrchestratorMonthly] = useState<number>(40); // background worker/orchestrator monthly baseline

  // Local (self-hosted) assumptions and per-provider monthly price
  const [localThroughputPerInstancePerDay, setLocalThroughputPerInstancePerDay] = useState<number>(6000); // minutes/day one instance can transcribe
  const [cloudRunMonthly, setCloudRunMonthly] = useState<number>(120); // $/mo per always-on instance equivalent
  const [renderMonthly, setRenderMonthly] = useState<number>(40);
  const [vmMonthly, setVmMonthly] = useState<number>(30);

  // Notes state (simple scratch pad)
  const [notes, setNotes] = useState<string>(`Scratch Pad – Worker Strategy

Goals
- Ship fast; keep costs reasonable; scale later
- Prefer free YouTube captions where possible
- Hybrid plan: captions → API/GPU only when needed

Assumptions (adjust on the right)
- API price: $0.006/min (editable)
- Local throughput: 6,000 minutes/day/instance (placeholder; measure!)
- Orchestrator baseline: $40/mo

Next decisions
- Start on GCP/Render for the worker (simple deploy)
- Add captions-first extraction
- Consider GPU transcriber if API costs dominate
`);

  // Derived metrics
  const derived = useMemo(() => {
    const totalMinutesPerDay = videosPerDay * avgMinutesPerVideo;
    const transcribedNeededMinutesPerDay = totalMinutesPerDay * (1 - clamp(captionCoveragePct, 0, 100) / 100);
    const apiMinutesPerDay = transcribedNeededMinutesPerDay * (clamp(apiSharePct, 0, 100) / 100);
    const localMinutesPerDay = Math.max(0, transcribedNeededMinutesPerDay - apiMinutesPerDay);

    const monthlyMultiplier = daysPerMonth > 0 ? daysPerMonth : 30;
    const minutesPerMonth = (m: number) => m * monthlyMultiplier;

    // API costs
    const apiDailyCost = apiMinutesPerDay * apiPricePerMin;
    const apiMonthlyCost = apiDailyCost * monthlyMultiplier;

    // Local compute helpers
    const instancesNeeded = (minutesPerDay: number) =>
      localThroughputPerInstancePerDay > 0
        ? Math.ceil(minutesPerDay / localThroughputPerInstancePerDay)
        : 0;

    const localInstances = instancesNeeded(localMinutesPerDay);

    const localMonthlyCostCloudRun = localInstances * cloudRunMonthly;
    const localMonthlyCostRender = localInstances * renderMonthly;
    const localMonthlyCostVm = localInstances * vmMonthly;

    // Add orchestrator baseline to all scenarios
    const withOrchestrator = (n: number) => n + orchestratorMonthly;

    return {
      totalMinutesPerDay,
      transcribedNeededMinutesPerDay,
      apiMinutesPerDay,
      localMinutesPerDay,
      apiDailyCost,
      apiMonthlyCost: withOrchestrator(apiMonthlyCost),
      cloudRun: {
        instances: localInstances,
        monthly: withOrchestrator(localMonthlyCostCloudRun),
        daily: withOrchestrator(localMonthlyCostCloudRun) / monthlyMultiplier,
      },
      render: {
        instances: localInstances,
        monthly: withOrchestrator(localMonthlyCostRender),
        daily: withOrchestrator(localMonthlyCostRender) / monthlyMultiplier,
      },
      vm: {
        instances: localInstances,
        monthly: withOrchestrator(localMonthlyCostVm),
        daily: withOrchestrator(localMonthlyCostVm) / monthlyMultiplier,
      },
    };
  }, [
    videosPerDay,
    avgMinutesPerVideo,
    captionCoveragePct,
    apiSharePct,
    daysPerMonth,
    apiPricePerMin,
    localThroughputPerInstancePerDay,
    cloudRunMonthly,
    renderMonthly,
    vmMonthly,
    orchestratorMonthly,
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Worker Cost Playground</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Adjust assumptions and see live cost estimates. All values are rough and editable — use this as a planning scratch pad.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes Panel */}
        <section className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Research Notes</h2>
            <span className="text-xs text-muted-foreground">Autosave in memory</span>
          </div>
          <textarea
            className="min-h-[420px] w-full rounded-md border bg-white p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-gray-200"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        {/* Controls + Results */}
        <section className="rounded-lg border bg-white p-4 space-y-6">
          <div>
            <h2 className="font-medium mb-3">Scenario</h2>

            {/* Videos per day */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="videosPerDay">YouTube videos per day</Label>
                <Input
                  id="videosPerDay"
                  type="number"
                  className="w-28"
                  value={videosPerDay}
                  onChange={(e) => setVideosPerDay(clamp(Number(e.target.value || 0), 0, 20000))}
                />
              </div>
              <Slider
                min={0}
                max={20000}
                step={100}
                value={[videosPerDay]}
                onValueChange={([v]) => setVideosPerDay(v)}
              />
            </div>

            {/* Avg minutes per video */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="avgMinutes">Avg minutes per video</Label>
                <Input
                  id="avgMinutes"
                  type="number"
                  className="w-28"
                  value={avgMinutesPerVideo}
                  onChange={(e) => setAvgMinutesPerVideo(clamp(Number(e.target.value || 0), 0, 120))}
                />
              </div>
              <Slider
                min={0}
                max={120}
                step={1}
                value={[avgMinutesPerVideo]}
                onValueChange={([v]) => setAvgMinutesPerVideo(v)}
              />
            </div>

            {/* Caption coverage */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="captionCoverage">Caption coverage (%)</Label>
                <Input
                  id="captionCoverage"
                  type="number"
                  className="w-28"
                  value={captionCoveragePct}
                  onChange={(e) => setCaptionCoveragePct(clamp(Number(e.target.value || 0), 0, 100))}
                />
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[captionCoveragePct]}
                onValueChange={([v]) => setCaptionCoveragePct(v)}
              />
            </div>

            {/* API share */}
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiShare">API share of remaining (%)</Label>
                <Input
                  id="apiShare"
                  type="number"
                  className="w-28"
                  value={apiSharePct}
                  onChange={(e) => setApiSharePct(clamp(Number(e.target.value || 0), 0, 100))}
                />
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[apiSharePct]}
                onValueChange={([v]) => setApiSharePct(v)}
              />
            </div>

            <div className="flex items-center justify-end gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="daysPerMonth">Days/month</Label>
                <Input
                  id="daysPerMonth"
                  type="number"
                  className="w-20"
                  value={daysPerMonth}
                  onChange={(e) => setDaysPerMonth(clamp(Number(e.target.value || 0), 1, 31))}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-medium mb-3">Pricing Assumptions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apiPrice">API $/minute</Label>
                <Input
                  id="apiPrice"
                  type="number"
                  step="0.001"
                  value={apiPricePerMin}
                  onChange={(e) => setApiPricePerMin(Math.max(0, Number(e.target.value || 0)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orchestratorMonthly">Orchestrator $/month</Label>
                <Input
                  id="orchestratorMonthly"
                  type="number"
                  step="1"
                  value={orchestratorMonthly}
                  onChange={(e) => setOrchestratorMonthly(Math.max(0, Number(e.target.value || 0)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="throughput">Local throughput (minutes/day/instance)</Label>
                <Input
                  id="throughput"
                  type="number"
                  step="50"
                  value={localThroughputPerInstancePerDay}
                  onChange={(e) => setLocalThroughputPerInstancePerDay(Math.max(0, Number(e.target.value || 0)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cloudRunMonthly">Cloud Run $/month/instance</Label>
                <Input
                  id="cloudRunMonthly"
                  type="number"
                  step="1"
                  value={cloudRunMonthly}
                  onChange={(e) => setCloudRunMonthly(Math.max(0, Number(e.target.value || 0)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renderMonthly">Render $/month/instance</Label>
                <Input
                  id="renderMonthly"
                  type="number"
                  step="1"
                  value={renderMonthly}
                  onChange={(e) => setRenderMonthly(Math.max(0, Number(e.target.value || 0)))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vmMonthly">VM $/month/instance</Label>
                <Input
                  id="vmMonthly"
                  type="number"
                  step="1"
                  value={vmMonthly}
                  onChange={(e) => setVmMonthly(Math.max(0, Number(e.target.value || 0)))}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-medium mb-3">Derived</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Total minutes/day</div>
                <div className="text-lg font-medium">{derived.totalMinutesPerDay.toLocaleString()}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Needs transcription/day</div>
                <div className="text-lg font-medium">{derived.transcribedNeededMinutesPerDay.toLocaleString()}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">API minutes/day</div>
                <div className="text-lg font-medium">{derived.apiMinutesPerDay.toLocaleString()}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Local minutes/day</div>
                <div className="text-lg font-medium">{derived.localMinutesPerDay.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-medium mb-3">Cost Estimates (Daily / Monthly)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="mb-1 font-medium">API Only</div>
                <div className="text-muted-foreground">Daily</div>
                <div className="text-lg">{formatCurrency(derived.apiDailyCost)}</div>
                <div className="text-muted-foreground mt-2">Monthly (incl. orchestrator)</div>
                <div className="text-lg">{formatCurrency(derived.apiMonthlyCost)}</div>
              </div>

              <div className="rounded-md border p-3">
                <div className="mb-1 font-medium">Cloud Run (local)</div>
                <div className="text-muted-foreground">Instances needed</div>
                <div className="text-lg">{derived.cloudRun.instances}</div>
                <div className="text-muted-foreground mt-2">Daily</div>
                <div className="text-lg">{formatCurrency(derived.cloudRun.daily)}</div>
                <div className="text-muted-foreground mt-2">Monthly (incl. orchestrator)</div>
                <div className="text-lg">{formatCurrency(derived.cloudRun.monthly)}</div>
              </div>

              <div className="rounded-md border p-3">
                <div className="mb-1 font-medium">Render (local)</div>
                <div className="text-muted-foreground">Instances needed</div>
                <div className="text-lg">{derived.render.instances}</div>
                <div className="text-muted-foreground mt-2">Daily</div>
                <div className="text-lg">{formatCurrency(derived.render.daily)}</div>
                <div className="text-muted-foreground mt-2">Monthly (incl. orchestrator)</div>
                <div className="text-lg">{formatCurrency(derived.render.monthly)}</div>
              </div>

              <div className="rounded-md border p-3 md:col-span-3">
                <div className="mb-1 font-medium">VM (local)</div>
                <div className="text-muted-foreground">Instances needed</div>
                <div className="text-lg">{derived.vm.instances}</div>
                <div className="text-muted-foreground mt-2">Daily</div>
                <div className="text-lg">{formatCurrency(derived.vm.daily)}</div>
                <div className="text-muted-foreground mt-2">Monthly (incl. orchestrator)</div>
                <div className="text-lg">{formatCurrency(derived.vm.monthly)}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

