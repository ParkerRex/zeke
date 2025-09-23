# Supabase Package

## Code Preferences

- Always import Database (or narrower table types) from src/types so every query/mutation relies on Supabase-generated typing—no any, keep @ts-nocheck temporary and scoped.
- Use the exported factory helpers (createClient, createClient({ admin: true }), updateSession) rather than instantiating Supabase clients ad hoc; they centralize env handling, cookie wiring, and warning suppression.
- Keep mutations/query helpers pure and side-effect free beyond Supabase calls; return typed results and bubble errors rather than swallowing them.
- When adding storage helpers, route everything through utils/storage so upload/remove/signed URL behavior stays consistent (shared cache headers, placeholder policy).
- New modules should export from package.json and src/index.ts style barrels in one pass; keep exports aligned with actual files.
- Follow Biome defaults (biome check/format) and run pnpm db:generate whenever the Supabase schema changes so src/types/db.ts stays current.

## Layout Guide

```
packages/supabase/
├── package.json                         # Supabase client package manifest and scripts.
├── tsconfig.json                        # TypeScript settings for Supabase helpers.
└── src/
    ├── client/
    │   ├── client.ts                    # Browser-side Supabase client factory.
    │   ├── server.ts                    # Server-side client with cookie/session handling.
    │   ├── job.ts                       # Service-role client for background jobs.
    │   └── middleware.ts                # Next middleware helper to refresh Supabase sessions.
    ├── mutations/
    │   └── index.ts                     # Typed Supabase mutation helpers (bank connections, plans, etc.).
    ├── queries/
    │   ├── cached-queries.ts            # Per-request cached Supabase session accessor.
    │   └── index.ts                     # Typed query helpers for users, teams, inbox, etc.
    ├── types/
    │   ├── db.ts                        # Generated Database types from Supabase schema.
    │   └── index.ts                     # Re-export of Database types and Supabase client alias.
    └── utils/
        └── storage.ts                   # Supabase storage helpers (upload, remove, signed URLs).
```
