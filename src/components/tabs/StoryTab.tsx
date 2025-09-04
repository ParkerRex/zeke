"use client";
import { Tab, useTabs } from "@/lib/tabsStore";

import OverlayPanel from "../overlays/OverlayPanel";
import { StoryKindIcon } from "@/components/stories/StoryKindIcon";
import IndustryTab from "./IndustryTab";
import CompanyTab from "./CompanyTab";

export default function StoryTab({ tab }: { tab: Tab }) {
  const { sidePanelOpen: showPanel } = useTabs();
  const safeSrcForKind = (kind: Tab["embedKind"], url: string) => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:') return 'about:blank';
      const host = u.hostname.replace(/^www\./, '');
      // Optional domain allow-lists per kind (tighten for known embeds)
      if (kind === 'youtube') {
        const allowed = new Set(['youtube.com', 'm.youtube.com']);
        if (![host, host.split('.').slice(1).join('.')].some((h) => allowed.has(h))) return 'about:blank';
      }
      if (kind === 'reddit') {
        const allowed = new Set(['redditmedia.com']);
        if (![host, host.split('.').slice(1).join('.')].some((h) => allowed.has(h))) return 'about:blank';
      }
      if (kind === 'hn') {
        if (host !== 'news.ycombinator.com') return 'about:blank';
      }
      // For podcasts, a variety of hosts are possible; rely on https-only here
      // For generic articles/arxiv/company/industry we only enforce https
      return u.toString();
    } catch {
      return 'about:blank';
    }
  };
  return (
    <div className="grid grid-cols-12 h-full relative">
      <div className={`${showPanel ? 'border-r' : ''} ${showPanel ? 'col-span-12 lg:col-span-8' : 'col-span-12'}` }>
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
            src={safeSrcForKind(tab.embedKind, tab.embedUrl)}
            title={`${tab.title} – YouTube`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-popups allow-presentation"
            referrerPolicy="no-referrer"
            name={`yt-${tab.id}`}
          />
        )}
        {(tab.embedKind === "article" || tab.embedKind === "arxiv" || tab.embedKind === "podcast") && (
          <iframe
            className="w-full h-full"
            src={safeSrcForKind(tab.embedKind, tab.embedUrl)}
            title={`${tab.title}`}
            sandbox="allow-scripts allow-popups"
            referrerPolicy="no-referrer"
          />
        )}
        {tab.embedKind === "reddit" && (
          <iframe
            className="w-full h-full"
            src={safeSrcForKind(tab.embedKind, tab.embedUrl)}
            title={`${tab.title} – Reddit`}
            sandbox="allow-scripts allow-popups"
            referrerPolicy="no-referrer"
          />
        )}
        {tab.embedKind === "hn" && (
          <iframe
            className="w-full h-full"
            src={safeSrcForKind(tab.embedKind, tab.embedUrl)}
            title={`${tab.title} – Hacker News`}
            sandbox="allow-scripts allow-popups"
            referrerPolicy="no-referrer"
          />
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
