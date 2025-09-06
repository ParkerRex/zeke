"use client";
import { StoryKindIcon } from "@/components/stories/StoryKindIcon";
import { type Tab, useTabs } from "@/lib/tabsStore";
import OverlayPanel from "../overlays/OverlayPanel";
import CompanyTab from "./CompanyTab";
import IndustryTab from "./IndustryTab";

export default function StoryTab({ tab }: { tab: Tab }) {
  const { sidePanelOpen: showPanel } = useTabs();
  const safeSrcForKind = (kind: Tab["embedKind"], url: string) => {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:") return "about:blank";
      const host = u.hostname.replace(/^www\./, "");
      // Optional domain allow-lists per kind (tighten for known embeds)
      if (kind === "youtube") {
        const allowed = new Set(["youtube.com", "m.youtube.com"]);
        if (
          ![host, host.split(".").slice(1).join(".")].some((h) =>
            allowed.has(h)
          )
        )
          return "about:blank";
      }
      if (kind === "reddit") {
        const allowed = new Set(["redditmedia.com"]);
        if (
          ![host, host.split(".").slice(1).join(".")].some((h) =>
            allowed.has(h)
          )
        )
          return "about:blank";
      }
      if (kind === "hn" && host !== "news.ycombinator.com")
        return "about:blank";
      // For podcasts, a variety of hosts are possible; rely on https-only here
      // For generic articles/arxiv/company/industry we only enforce https
      return u.toString();
    } catch {
      return "about:blank";
    }
  };
  return (
    <div className="relative grid h-full grid-cols-12">
      <div
        className={`${showPanel ? "border-r" : ""} ${showPanel ? "col-span-12 lg:col-span-8" : "col-span-12"}`}
      >
        {/* Optional header for kind; keeps a consistent top gutter (not for industry) */}
        {tab.embedKind !== "industry" && (
          <div className="hidden items-center gap-2 border-b p-2 text-gray-600 text-xs sm:flex">
            <StoryKindIcon kind={tab.embedKind} />
            <span className="truncate">{tab.embedUrl}</span>
          </div>
        )}
        {tab.embedKind === "industry" && <IndustryTab tab={tab} />}
        {tab.embedKind === "company" && <CompanyTab tab={tab} />}
        {tab.embedKind === "youtube" && (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            name={`yt-${tab.id}`}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-popups allow-presentation"
            src={safeSrcForKind(tab.embedKind, tab.embedUrl)}
            title={`${tab.title} – YouTube`}
          />
        )}
        {(tab.embedKind === "article" ||
          tab.embedKind === "arxiv" ||
          tab.embedKind === "podcast") && (
          <iframe
            className="h-full w-full"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-popups"
            src={safeSrcForKind(tab.embedKind, tab.embedUrl)}
            title={`${tab.title}`}
          />
        )}
        {tab.embedKind === "reddit" && (
          <iframe
            className="h-full w-full"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-popups"
            src={safeSrcForKind(tab.embedKind, tab.embedUrl)}
            title={`${tab.title} – Reddit`}
          />
        )}
        {tab.embedKind === "hn" && (
          <iframe
            className="h-full w-full"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-popups"
            src={safeSrcForKind(tab.embedKind, tab.embedUrl)}
            title={`${tab.title} – Hacker News`}
          />
        )}
      </div>
      {showPanel &&
        tab.embedKind !== "industry" &&
        tab.embedKind !== "company" && (
          <div className="hidden lg:col-span-4 lg:block">
            <OverlayPanel tab={tab} />
          </div>
        )}
    </div>
  );
}
