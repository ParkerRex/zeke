'use client';
import { type Tab, useTabs } from '@/hooks/use-tabs';
import CompanyTab from './company-tab';
import IndustryTab from './industry-tab';
import OverlayPanel from './overlay-panel';
import { StoryKindIcon } from './story-kind-icon';

// Precompiled regex for performance (Biome: useTopLevelRegex)
const WWW_PREFIX = /^www\./;

// Embed configuration to simplify conditional rendering and reduce complexity
const EMBED_CONFIG: Record<
  Exclude<Tab['embedKind'], 'industry' | 'company'>,
  {
    titleSuffix?: string;
    allow?: string;
    sandbox: string;
  }
> = {
  youtube: {
    titleSuffix: 'YouTube',
    allow:
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    sandbox: 'allow-scripts allow-popups allow-presentation',
  },
  article: {
    sandbox: 'allow-scripts allow-popups',
  },
  arxiv: {
    sandbox: 'allow-scripts allow-popups',
  },
  podcast: {
    sandbox: 'allow-scripts allow-popups',
  },
  reddit: {
    titleSuffix: 'Reddit',
    sandbox: 'allow-scripts allow-popups',
  },
  hn: {
    titleSuffix: 'Hacker News',
    sandbox: 'allow-scripts allow-popups',
  },
  twitter: {
    titleSuffix: undefined,
    allow: undefined,
    sandbox: '',
  },
};

const YOUTUBE_ALLOWED = new Set(['youtube.com', 'm.youtube.com']);
const REDDIT_ALLOWED = new Set(['redditmedia.com']);

function normalizeHost(hostname: string) {
  return hostname.replace(WWW_PREFIX, '');
}

function isAllowedForKind(kind: Tab['embedKind'], host: string) {
  if (kind === 'youtube') {
    const candidates = [host, host.split('.').slice(1).join('.')];
    return candidates.some((h) => YOUTUBE_ALLOWED.has(h));
  }
  if (kind === 'reddit') {
    const candidates = [host, host.split('.').slice(1).join('.')];
    return candidates.some((h) => REDDIT_ALLOWED.has(h));
  }
  if (kind === 'hn') {
    return host === 'news.ycombinator.com';
  }
  // Podcasts/articles/arxiv accept any https host
  return true;
}

function safeSrcForKind(kind: Tab['embedKind'], url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') {
      return 'about:blank';
    }
    const host = normalizeHost(u.hostname);
    if (!isAllowedForKind(kind, host)) {
      return 'about:blank';
    }
    return u.toString();
  } catch {
    return 'about:blank';
  }
}

export default function StoryTab({ tab }: { tab: Tab }) {
  const { sidePanelOpen: showPanel } = useTabs();
  const src = safeSrcForKind(tab.embedKind, tab.embedUrl);
  const showHeader = tab.embedKind !== 'industry';
  const showOverlay =
    showPanel && tab.embedKind !== 'industry' && tab.embedKind !== 'company';

  // Prepare main content to reduce conditional JSX branches
  let mainContent: React.ReactNode;
  if (tab.embedKind === 'industry') {
    mainContent = <IndustryTab tab={tab} />;
  } else if (tab.embedKind === 'company') {
    mainContent = <CompanyTab tab={tab} />;
  } else {
    const cfg = EMBED_CONFIG[tab.embedKind as keyof typeof EMBED_CONFIG];
    const title = cfg?.titleSuffix
      ? `${tab.title} – ${cfg.titleSuffix}`
      : `${tab.title}`;
    const common = {
      className: 'h-full w-full',
      referrerPolicy: 'no-referrer' as const,
      sandbox: cfg?.sandbox,
      src,
      title,
    };
    if (tab.embedKind === 'youtube') {
      mainContent = (
        <iframe
          {...common}
          allow={cfg?.allow}
          allowFullScreen
          name={`yt-${tab.id}`}
        />
      );
    } else {
      mainContent = <iframe {...common} />;
    }
  }
  return (
    <div className="relative grid h-full grid-cols-12">
      <div
        className={`${showPanel ? 'border-r' : ''} ${showPanel ? 'col-span-12 lg:col-span-8' : 'col-span-12'}`}
      >
        {/* Optional header for kind; keeps a consistent top gutter (not for industry) */}
        {showHeader && (
          <div className="hidden items-center gap-2 border-b p-2 text-gray-600 text-xs sm:flex">
            <StoryKindIcon kind={tab.embedKind} />
            <span className="truncate">{tab.embedUrl}</span>
          </div>
        )}
        {mainContent}
      </div>
      {showOverlay && (
        <div className="hidden lg:col-span-4 lg:block">
          <OverlayPanel tab={tab} />
        </div>
      )}
    </div>
  );
}
