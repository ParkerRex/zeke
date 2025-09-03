"use client";
import { Tab } from "@/lib/tabsStore";

import OverlayPanel from "../overlays/OverlayPanel";

export default function StoryTab({ tab }: { tab: Tab }) {
  return (
    <div className="grid grid-cols-12 h-full">
      <div className="col-span-12 lg:col-span-8 border-r">
        {tab.embedKind === "youtube" && (
          <iframe
            className="w-full h-full"
            src={tab.embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )}
        {tab.embedKind === "article" && (
          <iframe
            className="w-full h-full"
            src={tab.embedUrl}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}
        {tab.embedKind === "reddit" && (
          <iframe className="w-full h-full" src={tab.embedUrl} />
        )}
        {tab.embedKind === "hn" && (
          <iframe className="w-full h-full" src={tab.embedUrl} />
        )}
      </div>
      <div className="hidden lg:block lg:col-span-4">
        <OverlayPanel tab={tab} />
      </div>
    </div>
  );
}

