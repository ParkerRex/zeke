Coding Preferences

- Centralize new analytics names in LogEvents; never hardcode event or channel strings outside that catalog.
- Shape event payloads with explicit TypeScript interfaces that extend PostEventPayload["properties"], so additional fields stay discoverable and type-safe.
- Route all tracking through the exported track helpers (client or server) to preserve the dev-mode console logging and the production-only guard.
- Mirror the existing consent + environment checks when adding new flows; compute cookies once, branch early, and keep background calls inside waitUntil.
- Keep React-facing pieces as tiny providers/hooks that forward to OpenPanel; prefer pure helper functions elsewhere to avoid leaking hook usage outside components.
- Treat server helpers as async factories that return plain method bags, which keeps composability high and makes them easy to stub in tests.

Project Layout

```
packages/events/
├── package.json          # Package metadata, shared scripts, and explicit export map for client/server/event entrypoints
├── tsconfig.json         # Extends the shared Next.js TypeScript baseline and scopes compilation to src/
└── src/                  # Runtime source for analytics wiring
    ├── client.tsx        # React provider that registers OpenPanel and exposes a client-side track helper with dev logging
    ├── events.ts         # Canonical catalogue of event names and channels consumed throughout the app
    └── server.ts         # Server-side setup returning a track helper that respects consent and defers OpenPanel calls via waitUntil
```