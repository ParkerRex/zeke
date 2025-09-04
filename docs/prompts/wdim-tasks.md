## What did I miss? Checklist

Use this to track code smells and follow-ups. Check items as we fix them.

High‑Risk / Logic
- [ ] Close-to-right respects visual order with pinning. `src/lib/tabsStore.ts`
- [x] Side panel toggle should be per tab (global toggle is confusing on industry/company). `src/app/(app)/layout.tsx`, `src/components/tabs/StoryTab.tsx`
- [x] Back button should fall back to `/stories` if history is empty/off-site. `src/app/(app)/layout.tsx`
- [ ] Document `/stories/page.tsx` null render and revisit SEO. `src/app/(app)/stories/page.tsx`

Behavioral / UX
- [x] Remove stray right border when panel is hidden. `src/components/tabs/StoryTab.tsx`
- [x] Broaden YouTube thumbnail parsing (watch?v, youtu.be). `src/components/tabs/TabsStrip.tsx`
- [x] Clarify preview promotion flow from item click vs tab click (single‑click opens preview; double‑click promotes; tab single‑click only activates). `StoriesGridClient.tsx`, `Feed/StoryRow.tsx`, `TabsStrip.tsx`
- [ ] Tooltip hover reliability across context menu interactions. `src/components/tabs/TabsStrip.tsx`

Accessibility
- [x] Add proper tablist semantics (`role="tablist"`, `aria-controls`, stable ids). `src/components/tabs/TabsStrip.tsx`
- [x] Add `title` to all iframes. `src/components/tabs/StoryTab.tsx`
- [ ] Ensure tooltip contrast is adequate across themes. `src/components/tabs/TabsStrip.tsx`

Maintainability / Perf
- [x] Consider moving layout chrome (`sidePanelOpen`) out of tabs store or make per-tab. `src/lib/tabsStore.ts`
- [ ] Avoid re-sorting on every mutation for large tab sets (batch/defer). `src/lib/tabsStore.ts`
- [x] Harden URL parsing and truncation for tooltip domain. `src/components/tabs/TabsStrip.tsx`
- [x] Remove or archive unused `StoriesSidebarClient`. `src/components/stories/StoriesSidebarClient.tsx`
- [x] Persist per‑tab side panel state across sessions. `src/lib/tabsStore.ts`

Small Nits
- [x] Prevent default on Enter/Space when activating tabs. `src/components/tabs/TabsStrip.tsx`
- [x] Remove/fade scroll gradient if it crowds tight tab stacks. `src/components/tabs/TabsStrip.tsx`
- [x] Standardize tooltip delay globally. `TooltipProvider`

Concrete Fixes (implementation tasks)
- [x] Implement close‑to‑right using pre‑sort order, re‑sort once done (no‑op on pinned). `src/lib/tabsStore.ts`
- [x] Per‑tab `panelOpen` state on `Tab` or keyed map. `tabsStore`
- [x] Tablist semantics: ids + `aria-controls` wiring. `TabsStrip`
- [x] Iframe `title` props. `StoryTab`
- [x] Robust YouTube ID parsing. `TabsStrip`
- [x] Conditional `border-r` when panel hidden. `StoryTab`

## Round 2

High‑Risk / Logic
- [x] Add guard/confirm when “Close to the right” would close many tabs; surface count in the action. `src/components/tabs/TabsStrip.tsx`, `src/lib/tabsStore.ts`
- [ ] Prefix non‑story tab ids to avoid collisions (e.g., `tab:company`, `tab:industries`). `src/components/company/CompanyPanel.tsx`, `src/components/industry/IndustryPanel.tsx`
- [ ] Scope global keybinds (Cmd/Ctrl+W, 1..9) to the tabstrip region to avoid hijacking browser shortcuts when focus is inside viewer iframes. `src/components/tabs/TabsStrip.tsx`

Security / Privacy
- [x] Tighten iframe sandbox for untrusted sources (remove `allow-same-origin`, minimize `allow`); add `referrerPolicy`. `src/components/tabs/StoryTab.tsx`
- [x] Validate `embedUrl` (https only; optional domain whitelist per kind) before using in `iframe.src`. `features/stories` usage sites
- [x] Add `allowFullScreen` for YouTube and name frames for AT. `src/components/tabs/StoryTab.tsx`

Performance
- [x] Use `batch()` in multi‑step tab operations (e.g., context‑menu mass actions). `src/lib/tabsStore.ts`, `src/components/tabs/TabsStrip.tsx`
- [ ] Extract shared stories fetch into `useStories` with `AbortController` to cancel stale requests; add basic caching. `TodayFeedClient`, `StoriesGridClient`, `Industry/Company` panels
- [ ] Consider lazy image loading for tooltip thumbnails; add small skeleton. `src/components/tabs/TabsStrip.tsx`

Accessibility
- [ ] Implement roving tabIndex (only one tabbable); on close, move focus to neighbor. `src/components/tabs/TabsStrip.tsx`
- [ ] Ensure tooltip contrast meets WCAG across themes (border/shadow/colors). `src/components/tabs/TabsStrip.tsx`

Routing / SSR / SEO
- [ ] Give `/stories` a minimal SSR shell/metadata for SEO/sharing (while viewer still drives content). `src/app/(app)/stories/page.tsx`
- [ ] Back button: also guard with same‑origin `document.referrer` before calling `router.back()`. `src/app/(app)/layout.tsx`

UX Consistency
- [ ] Hide tab close button under a width threshold; show on hover/focus only (Chrome‑style). `src/components/tabs/TabsStrip.tsx`
- [ ] Surface pinning affordance (e.g., tooltip footer hint or pin toggle when wide). `src/components/tabs/TabsStrip.tsx`

State Management
- [ ] Keep store client‑only; verify no server imports. Consider a tiny UI store if layout chrome grows. `src/lib/tabsStore.ts`
- [ ] Add “Reset panel state” control to clear persisted `panelOpenById`. `src/app/(app)/layout.tsx`

API / Reliability
- [ ] Add loading/error UI + retry for stories fetchers; cancel on unmount. `TodayFeedClient`, `StoriesGridClient`
- [ ] Try/catch for `restoreFromUrl` and toast on failure. `src/lib/tabsStore.ts`

Code Hygiene
- [ ] Remove `as any` casts around overlays; tighten typing. `src/components/tabs/TabsStrip.tsx`
- [ ] Centralize shared strings (empty states/tooltips) for future i18n. `src/components/*`
- [x] Add batch helper to update many tabs in one pass. `tabsStore`
