# App shape (Next.js App Router)

```
/app
  /(marketing)
    page.tsx
  /(app)
    layout.tsx           // shell: Sidebar + Topbar + <TabsViewport/>
    page.tsx             // Today feed
    /story/[clusterId]   // shareable story tab route
      page.tsx
    /share/[shareId]     // read-only shared view w/ overlays
      page.tsx
  /api
    /ingest/run
    /stories
      route.ts           // list clusters (query params: timeframe, watchlist)
    /stories/[id]
      route.ts           // single cluster detail
    /highlights
      route.ts
    /bookmarks
      route.ts
    /share
      route.ts           // create & resolve share links
```

---

# Data model (Postgres/Supabase)

**Tables**

- `source(id, name, type, authority_score, rss_url, domain)`
- `item(id, source_id, url, title, author, published_at, raw_text, emb_vector, hash_sim, engagement_json)`
- `cluster(id, title, summary, primary_url, created_at, updated_at)`
- `cluster_item(cluster_id, item_id)`
- `cluster_metrics(cluster_id, corroboration_count, novelty_score, recency_score, engagement_score, hype_chili integer, confidence decimal)`
- `user(id, email, created_at)`
- `bookmark(user_id, cluster_id, created_at)`
- `highlight(id, user_id, cluster_id, item_id, quote, note, ranges_json, created_at)`
- `watchlist(user_id, name, entities_json)` // MVP: entities = \["Anthropic","Mistral"]
- `share(id, user_id, cluster_id, overlay_snapshot_json, created_at)` // snapshot = cached “why it matters”, chilies, sources
- `digest_subscription(user_id, cadence, watchlist_id)` // cadence: daily

**Indexes**

- `item(hash_sim)` for near-dup detection (simhash).
- `item(emb_vector) ivfflat` for clustering (optional).
- `cluster_metrics(hype_chili, confidence)` for ranking queries.

---

# Ranking (MVP formula)

```
score = 0.35*recency + 0.25*authority + 0.2*corroboration + 0.2*engagement
authority = mean(source.authority_score of cluster items)
corroboration = distinct(domains in cluster)
engagement = normalized views/upvotes/comments (from engagement_json)
recency = decay(hours_since_first_item)
```

Chili hype 🌶 = quantized `engagement / corroboration` with penalty if `confidence < 0.5`.

Confidence = min(1, corroboration/5) \* source_authority_prior.

---

# Ingestion (cron worker)

1. Pull RSS/APIs (Reddit/HN/YouTube/Reuters/blogs).
2. **Normalize** → compute `hash_sim` (simhash) + `emb_vector`.
3. **Assign to cluster**: nearest existing cluster by (simhash Hamming distance < K) OR cosine sim > τ; else create new cluster.
4. Update `cluster.summary` (extractive), `whyItMatters` (LLM, cite items), `cluster_metrics`.

---

# Client architecture

## State & data flow

- **Data fetching**: server components use `GET /api/stories` (or server actions) for feed; client components open tabs using a **Zustand** store.
- **Tabs store** keeps a list of open tabs + active tab id. Each tab carries `clusterId`, `embedKind`, `embedUrl`, and overlay data.

### Zustand store (tabs)

```ts
// /lib/tabsStore.ts
import { create } from 'zustand';

export type Tab = {
  id: string; // clusterId or "share:abc123"
  title: string;
  embedKind: 'youtube' | 'article' | 'reddit' | 'hn';
  embedUrl: string;
  clusterId?: string;
  shareId?: string;
  overlays: {
    whyItMatters: string;
    chili: number;
    sources: Array<{ title: string; url: string; domain: string }>;
    confidence: number;
  };
};

type TabsState = {
  tabs: Tab[];
  activeId?: string;
  openTab: (tab: Tab) => void;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  updateOverlay: (id: string, partial: Partial<Tab['overlays']>) => void;
  restoreFromUrl: (clusterIdOrShareId: string, isShare?: boolean) => Promise<void>;
};

export const useTabs = create<TabsState>((set, get) => ({
  tabs: [],
  activeId: undefined,
  openTab: (tab) =>
    set((s) =>
      s.tabs.some((t) => t.id === tab.id) ? { activeId: tab.id } : { tabs: [...s.tabs, tab], activeId: tab.id }
    ),
  closeTab: (id) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeId = s.activeId === id ? tabs[idx - 1]?.id || tabs[0]?.id : s.activeId;
      return { tabs, activeId };
    }),
  setActive: (id) => set({ activeId: id }),
  updateOverlay: (id, partial) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, overlays: { ...t.overlays, ...partial } } : t)) })),
  restoreFromUrl: async (id, isShare) => {
    const endpoint = isShare ? `/api/share?id=${id}` : `/api/stories/${id}`;
    const res = await fetch(endpoint).then((r) => r.json());
    const tab: Tab = {
      id: isShare ? `share:${id}` : id,
      title: res.title,
      embedKind: res.embedKind,
      embedUrl: res.embedUrl,
      clusterId: isShare ? undefined : id,
      shareId: isShare ? id : undefined,
      overlays: res.overlays, // whyItMatters, chili, sources, confidence
    };
    get().openTab(tab);
  },
}));
```

---

## Component tree

```
<AppShell>
  <Sidebar/>            // Today / Sector / Company / Tools / Leaderboards
  <Main>
    <Topbar/>           // Search, tabs strip (scrollable), actions
    <TabsViewport>      // shows the active <StoryTab/>
      <TabsStrip/>      // list of open tabs with close buttons
      <StoryTab/>       // active tab content
    </TabsViewport>
  </Main>
</AppShell>
```

### Key components (files & responsibilities)

- `components/shell/Sidebar.tsx`

  - Filters (Today, Sector, Company, Watchlists); clicking filter refetches feed.

- `components/feed/FeedList.tsx` (server component)

  - Fetches clusters; renders `StoryRow` list.
  - `StoryRow` has open-in-tab action.

- `components/tabs/TabsStrip.tsx` (client)

  - Reads `useTabs()`; renders closable pills; handles reordering later.

- `components/tabs/StoryTab.tsx` (client)

  - Layout: **ContentPane** + **OverlayPane**
  - ContentPane: `<YouTubeEmbed/> | <ArticleEmbed/> | <RedditEmbed/>` based on `embedKind`.
  - OverlayPane: `<WhyItMatters/> <ChiliScore/> <SourcesList/> <BookmarkButton/> <HighlightButton/>`.

- `components/overlays/WhyItMatters.tsx`

  - Displays snapshot + “View citations (#)” dropdown.

- `components/overlays/ChiliScore.tsx`

  - Renders 🌶 × n with tooltip explaining score.

- `components/overlays/HighlightButton.tsx`

  - For articles: overlays a transparent selection layer (or instructs user to select text inside iframe → fallback to whole-paragraph highlight via `postMessage`).
  - Saves highlight via `/api/highlights`.

- `components/share/ShareButton.tsx`

  - Calls `/api/share` to create a `share.id`; copies `/share/[id]` to clipboard.
  - Shared page loads **read-only** tab with overlays.

- `components/digest/DigestOptIn.tsx`

  - Toggle cadence and default watchlist.

---

## Route behaviors

- **`/` (Today)**: server component renders FeedList of top clusters. Clicking a row calls `useTabs().restoreFromUrl(clusterId)`.
- **`/story/[clusterId]`**: direct link (or back/forward) hydrates the tab store via `restoreFromUrl`.
- **`/share/[shareId]`**: read-only view, no login required; displays the tab with overlays snapshot; CTA to sign up.

Use URL sync: when activeId changes, push `router.push(/story/[clusterId])` for deep linking.

---

## API contracts (JSON)

**GET `/api/stories?timeframe=today&watchlist=mistral,anthropic`**

```json
{
  "clusters": [
    {
      "id": "clu_123",
      "title": "Mistral releases 8x7B",
      "primaryUrl": "https://…",
      "embedKind": "article",
      "embedUrl": "https://…",
      "overlays": {
        "whyItMatters": "Open weights alter…",
        "chili": 4,
        "confidence": 0.72,
        "sources": [
          { "title": "Reuters", "url": "https://…", "domain": "reuters.com" },
          { "title": "HN thread", "url": "https://…", "domain": "news.ycombinator.com" }
        ]
      }
    }
  ]
}
```

**GET `/api/stories/[id]`** → same shape as a single `cluster`.

**POST `/api/bookmarks`** `{ clusterId }` → 200.

**POST `/api/highlights`** `{ clusterId, itemId, quote, note, ranges }` → `{ id }`.

**POST `/api/share`** `{ clusterId }` → `{ id: "shr_abc123", url: "/share/shr_abc123" }`.

**GET `/api/share?id=shr_abc123`** → returns the snapshot (title, embedKind/url, overlays).

---

## Embeds & overlays

### YouTube

- Use standard `<iframe>` embed with `?modestbranding=1&rel=0`.
- Sentiment proxy: pull top N comments via API when BYO key present; else fallback to like/views ratio.

### Articles (iframes)

- Try `<iframe sandbox>`; if X-Frame-Options blocks, show a “reader” view (Mercury/Readability extraction) + “open original” button.
- **Highlights** in iframe: preferred = `postMessage` bridge for selected text; fallback = paragraph-level highlights in reader view.

---

## Auth & gating

- **Unauthenticated** users: can open tabs and view overlays, **no** bookmarking/highlighting, digest opt-in asks for email.
- **Free**: 1 watchlist, 3 stories/day in digest.
- **Pro**: unlimited watchlists, highlights, full digest, history.

---

## Styling & UX notes

- shadcn/ui for Tabs, Drawer/Sheet for OverlayPane on mobile.
- Keyboard: `⌘1..9` switch tabs; `⌘W` close tab; `Shift+S` share.
- Keep overlays **dockable** (right side default; allow bottom dock later).
- Tooltips on chili/confidence to build trust: “4🌶 because engagement>>corroboration; confidence 0.42 (2 independent sources).”

---

# Minimal UI code skeletons

### TabsViewport

```tsx
// components/tabs/TabsViewport.tsx
'use client';
import { useTabs } from '@/lib/tabsStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import StoryTab from './StoryTab';

export default function TabsViewport() {
  const { tabs, activeId, setActive, closeTab } = useTabs();
  if (!tabs.length) return <div className='text-muted-foreground p-6'>Open a story to begin.</div>;

  return (
    <div className='flex h-full flex-col'>
      <Tabs value={activeId} onValueChange={setActive} className='w-full'>
        <TabsList className='max-w-full overflow-x-auto'>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className='flex items-center gap-2'>
              <span className='max-w-[220px] truncate'>{t.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(t.id);
                }}
              >
                <X className='h-3 w-3' />
              </button>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id} className='h-[calc(100vh-8rem)] p-0'>
            <StoryTab tab={t} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

### StoryTab

```tsx
// components/tabs/StoryTab.tsx
'use client';
import { Tab } from '@/lib/tabsStore';
import OverlayPanel from '../overlays/OverlayPanel';

export default function StoryTab({ tab }: { tab: Tab }) {
  return (
    <div className='grid h-full grid-cols-12'>
      <div className='col-span-8 border-r'>
        {tab.embedKind === 'youtube' && (
          <iframe
            className='h-full w-full'
            src={tab.embedUrl}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          />
        )}
        {tab.embedKind === 'article' && (
          <iframe className='h-full w-full' src={tab.embedUrl} sandbox='allow-scripts allow-same-origin allow-popups' />
        )}
        {/* other kinds... */}
      </div>
      <div className='col-span-4'>
        <OverlayPanel tab={tab} />
      </div>
    </div>
  );
}
```

### OverlayPanel

```tsx
// components/overlays/OverlayPanel.tsx
'use client';
import { Tab, useTabs } from '@/lib/tabsStore';
import { Button } from '@/components/ui/button';

export default function OverlayPanel({ tab }: { tab: Tab }) {
  const share = async () => {
    const r = await fetch('/api/share', { method: 'POST', body: JSON.stringify({ clusterId: tab.clusterId }) });
    const { url } = await r.json();
    navigator.clipboard.writeText(url);
  };

  return (
    <div className='flex h-full flex-col gap-4 p-4'>
      <div>
        <h3 className='text-xl font-semibold'>Why it matters</h3>
        <p className='text-sm leading-6'>{tab.overlays.whyItMatters}</p>
      </div>

      <div className='flex items-center gap-2'>
        <span className='font-medium'>Hype</span>
        <span aria-label='chili'>{Array.from({ length: tab.overlays.chili }).map((_, i) => '🌶')}</span>
        <span className='text-muted-foreground text-xs'>confidence {(tab.overlays.confidence * 100).toFixed(0)}%</span>
      </div>

      <div>
        <h4 className='mb-1 font-medium'>Sources</h4>
        <ul className='ml-5 list-disc space-y-1'>
          {tab.overlays.sources.map((s) => (
            <li key={s.url}>
              <a className='underline' href={s.url} target='_blank'>
                {s.title}
              </a>{' '}
              <span className='text-muted-foreground text-xs'>({s.domain})</span>
            </li>
          ))}
        </ul>
      </div>

      <div className='mt-auto flex gap-2'>
        <Button onClick={share}>Share</Button>
        {/* Bookmark / Highlight add later */}
      </div>
    </div>
  );
}
```

---

# Daily Digest (MVP)

- Cron job selects top 3 clusters (or top in user’s watchlist).
- Render a simple HTML email with title + 1-line “why it matters” + 🌶.
- CTA buttons: “Open tab” → `/story/[clusterId]`.

---

# Analytics & instrumentation

- `event: "open_tab" | "share" | "bookmark" | "highlight" | "digest_open"` with `clusterId`, `source`, `utm`.
- Track **share conversion**: visits to `/share/[id]` → signups.

---

# What to build **today**

1. DB migrations for the schema above.
2. Ingestion worker for 8–12 feeds + clustering (simhash first; embeddings later).
3. `/api/stories` + `/api/stories/[id]`.
4. Tabs store + `TabsViewport`, `StoryTab`, `OverlayPanel`.
5. `/api/share` + `/share/[id]` route.
6. Skeleton digest job (fixed list for now).

This gets you the **Figma-like tabs**, overlays, shareable views, and a working loop for growth. If you want, I can also draft the **SQL migrations** and a **very small ingestion script** starter next.
