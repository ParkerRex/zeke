## What did I miss? Checklist

Use this to track code smells and follow-ups. Check items as we fix them.

High‑Risk / Logic

- [ ] Close-to-right respects visual order with pinning. `src/lib/tabsStore.ts`
- [ ] Document `/stories/page.tsx` null render and revisit SEO. `src/app/(app)/stories/page.tsx`

Behavioral / UX

- [ ] Tooltip hover reliability across context menu interactions. `src/components/tabs/TabsStrip.tsx`

Accessibility

- [ ] Ensure tooltip contrast is adequate across themes. `src/components/tabs/TabsStrip.tsx`

Maintainability / Perf

- [ ] Avoid re-sorting on every mutation for large tab sets (batch/defer). `src/lib/tabsStore.ts`

## Round 2

High‑Risk / Logic

- [ ] Prefix non‑story tab ids to avoid collisions (e.g., `tab:company`, `tab:industries`). `src/components/company/CompanyPanel.tsx`, `src/components/industry/IndustryPanel.tsx`
- [ ] Scope global keybinds (Cmd/Ctrl+W, 1..9) to the tabstrip region to avoid hijacking browser shortcuts when focus is inside viewer iframes. `src/components/tabs/TabsStrip.tsx`

Performance

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
- [ ] Add "Reset panel state" control to clear persisted `panelOpenById`. `src/app/(app)/layout.tsx`

API / Reliability

- [ ] Add loading/error UI + retry for stories fetchers; cancel on unmount. `TodayFeedClient`, `StoriesGridClient`
- [ ] Try/catch for `restoreFromUrl` and toast on failure. `src/lib/tabsStore.ts`

Code Hygiene

- [ ] Remove `as any` casts around overlays; tighten typing. `src/components/tabs/TabsStrip.tsx`
- [ ] Centralize shared strings (empty states/tooltips) for future i18n. `src/components/*`
