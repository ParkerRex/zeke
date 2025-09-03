"use client";
import { Button } from "@/components/ui/button";
import { Tab } from "@/lib/tabsStore";

export default function OverlayPanel({ tab }: { tab: Tab }) {
  const share = async () => {
    const r = await fetch("/api/share", { method: "POST", body: JSON.stringify({ clusterId: tab.clusterId }) });
    const { url } = await r.json();
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="h-full p-4 flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-semibold">Why it matters</h3>
        <p className="text-sm leading-6">{tab.overlays.whyItMatters}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium">Hype</span>
        <span aria-label="chili">{Array.from({ length: tab.overlays.chili }).map((_, i) => "🌶")}</span>
        <span className="text-xs text-muted-foreground">confidence {(tab.overlays.confidence * 100).toFixed(0)}%</span>
      </div>

      <div>
        <h4 className="font-medium mb-1">Sources</h4>
        <ul className="list-disc ml-5 space-y-1">
          {tab.overlays.sources.map((s) => (
            <li key={s.url}>
              <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>{" "}
              <span className="text-xs text-muted-foreground">({s.domain})</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex gap-2">
        <Button onClick={share}>Share</Button>
        {/* TODO: Bookmark / Highlight buttons */}
      </div>
    </div>
  );
}

