"use client";
import { Tab, useTabs } from "@/lib/tabsStore";

import OverlayPanel from "../overlays/OverlayPanel";
import { StoryKindIcon } from "@/components/stories/StoryKindIcon";
import IndustryTab from "./IndustryTab";
import CompanyTab from "./CompanyTab";

export default function StoryTab({ tab }: { tab: Tab }) {
  const { sidePanelOpen: showPanel } = useTabs();
  return (
    <div className="grid grid-cols-12 h-full relative">
      <div className={`border-r ${showPanel ? 'col-span-12 lg:col-span-8' : 'col-span-12'}` }>
        {/* Optional header for kind; keeps a consistent top gutter (not for industry) */}
        {tab.embedKind !== "industry" && (
          <div className="hidden items-center gap-2 border-b p-2 text-xs text-gray-600 sm:flex">
            <StoryKindIcon kind={tab.embedKind} />
            <span className="truncate">{tab.embedUrl}</span>
          </div>
        )}
        {tab.embedKind === "industry" && <IndustryTab tab={tab} />}
        {tab.embedKind === "company" && <CompanyTab tab={tab} />}
        {tab.embedKind === "youtube" && (
          <iframe
            className="w-full h-full"
            src={tab.embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )}
        {(tab.embedKind === "article" || tab.embedKind === "arxiv" || tab.embedKind === "podcast") && (
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
      {showPanel && tab.embedKind !== "industry" && tab.embedKind !== "company" && (
        <div className="hidden lg:block lg:col-span-4">
          <OverlayPanel tab={tab} />
        </div>
      )}
    </div>
  );
}
