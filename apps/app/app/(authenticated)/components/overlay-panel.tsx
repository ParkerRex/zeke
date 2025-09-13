"use client";
import { Button } from "@zeke/design-system/components/ui/button";
import type { Tab } from "@/stores/tabsStore";

const PERCENTAGE_MULTIPLIER = 100;

export default function OverlayPanel({ tab }: { tab: Tab }) {
  const share = async () => {
    const r = await fetch("/api/share", {
      method: "POST",
      body: JSON.stringify({ clusterId: tab.clusterId }),
    });
    const { url } = await r.json();
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <h3 className="font-semibold text-xl">Why it matters</h3>
        <p className="text-sm leading-6">{tab.overlays.whyItMatters}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium">Hype</span>
        <span>{Array.from({ length: tab.overlays.chili }).map(() => "🌶")}</span>
        <span className="text-muted-foreground text-xs">
          confidence{" "}
          {(tab.overlays.confidence * PERCENTAGE_MULTIPLIER).toFixed(0)}%
        </span>
      </div>

      <div>
        <h4 className="mb-1 font-medium">Sources</h4>
        <ul className="ml-5 list-disc space-y-1">
          {tab.overlays.sources.map((s) => (
            <li key={s.url}>
              <a
                className="underline"
                href={s.url}
                rel="noreferrer"
                target="_blank"
              >
                {s.title}
              </a>{" "}
              <span className="text-muted-foreground text-xs">
                ({s.domain})
              </span>
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
