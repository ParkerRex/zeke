# Desktop Client Package

## Desktop Client Preferences

- TypeScript-first: keep everything in src/ typed explicitly, prefer interfaces over type unions when modelling objects returned to consumers, and lean on literal types for platform flags.
- Keep the package as a thin wrapper around Tauri: re-export what we need, avoid duplicate abstractions, and document any new helper with a one-line JSDoc plus usage example.
- Fail soft in browser contexts: every desktop-only helper should gracefully no-op when isTauri() is false, logging at console.debug/console.warn level instead of throwing.
- Make side-effects explicit: return cleanup functions from listeners, and ensure functions like listenForDeepLinks always resolve to a callable disposer.
- Tailwind plugins live in CommonJS for compatibility; constrain the API surface with local interfaces so we don't rely on implicit any.
- Tests (when added) should stub Tauri APIs and focus on contract validation: exported signatures, platform gating, and emitted events.

## Layout Guide

```
packages/
└─ desktop-client/
   ├─ package.json                // Declares the private package, Tauri dependency, and export map for each helper entry point.
   └─ src/
      ├─ core.ts                  // Re-exports the subset of Tauri core/window/event APIs we expose to downstream apps.
      ├─ platform.ts              // Runtime platform helpers: desktop detection, deep-link listener wiring, and URL builder.
      └─ desktop-variants.ts      // Tailwind plugin that injects desktop/mac/windows/linux variants based on HTML root classes.
```