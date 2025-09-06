Sentry Observability Spec (Web + Worker + DB)

Objective

- Establish error tracking and basic performance tracing with minimal code churn and ongoing cost.
- Replace ad-hoc console logging in app code with actionable telemetry and clear runbooks.
- Focus on highest-leverage boundaries: API routes, server actions, worker jobs, and user-facing client errors.

Non‑Goals

- Full DB log shipping or deep SQL-level APM. We capture at app/worker boundaries.
- Building custom dashboards beyond Sentry’s built-ins.
- Refactoring the data layer to push Sentry calls into queries/mutations (kept third‑party free).

Scope

- Next.js app (server + client) and background worker (Node/pg-boss).
- DB interactions via Supabase: capture errors and timing at call sites (actions, routes, worker), not inside query/mutation modules.
- Source maps and releases for readable stack traces.

Architecture Overview

- Web:
  - Use @sentry/nextjs. Autoload configs via sentry.client.config.ts and sentry.server.config.ts.
  - Wrap next.config.js with withSentryConfig for source maps and better stack traces.
  - Capture at boundaries: API routes, server actions; client components capture exceptions and show user feedback.
- Worker:
  - Use @sentry/node (+ profiling). Initialize once at process start.
  - Wrap each job with a helper that creates a span, adds job metadata, and captures exceptions.
  - Capture unhandled rejections/exceptions; flush on shutdown.
- DB:
  - Do not call Sentry inside query/mutation modules to preserve “no 3rd‑party” rule.
  - Instead, wrap calls in actions/routes/worker with spans and capture exceptions, tagging db.operation/table.

Environments & Secrets

- Required (web):
  - SENTRY_DSN (server)
  - NEXT_PUBLIC_SENTRY_DSN (client)
  - SENTRY_ENVIRONMENT (development|preview|production)
- Required (worker):
  - SENTRY_DSN, SENTRY_ENVIRONMENT
- Source maps (CI/Vercel):
  - SENTRY_AUTH_TOKEN, plus sentry.properties (org, project) in repo root.

Sampling Defaults (tune post‑rollout)

- Errors: 100% (default) — rely on alerts/rate limits for noise.
- Traces: 0.1 (10%)
- Profiles (worker): 0.05 initially or disabled if noisy.

Web Implementation

1. Dependencies

- Add @sentry/nextjs to root web app.

2. Config files (autoloaded by @sentry/nextjs)

- sentry.client.config.ts: initialize Browser SDK with dsn from NEXT_PUBLIC_SENTRY_DSN, environment, tracesSampleRate.
- sentry.server.config.ts: initialize Node SDK with SENTRY_DSN, environment, tracesSampleRate; set beforeSend scrubber.
- Optional sentry.edge.config.ts if any edge handlers exist.

3. next.config.js

- Wrap export with withSentryConfig(nextConfig, pluginOpts, uploadOpts), enabling hidden source maps in prod.

4. Instrumentation patterns (where to add code)

- API routes (e.g., src/app/api/\*\*/route.ts): try/catch per handler; on error, Sentry.captureException(err); return sanitized error.
- Server actions (e.g., src/app/\*\*/actions.ts): wrap body with Sentry.startSpan({ name: 'action:xyz' }, fn) and capture exceptions.
- Client components: on catchable failures, call Sentry.captureException(err) and display a toast/UI message. Avoid console.\*.
- Remove console.\* usages in app code; use captureException or a dev-only debug helper (no-op in production) if needed.

5. PII & scrubbing

- Use beforeSend to drop headers like Authorization, cookies, and redact tokens/emails from request bodies/contexts where present.

Worker Implementation

1. Dependencies

- Add @sentry/node and @sentry/profiling-node in worker/package.json.

2. Initialization (worker/src/worker.ts)

- Initialize Sentry early with DSN and environment.
- Enable profiling integration (optional), and set tracesSampleRate/profilesSampleRate.
- Hook process.on('unhandledRejection'|'uncaughtException') to Sentry.captureException.

3. Job wrapper

- Implement a helper (e.g., withJobSpan(name, meta, fn)) that:
  - Calls Sentry.startSpan({ name: `job:${name}`, attributes: { ...meta } }, fn)
  - try/catch inside; Sentry.captureException(err) on failure; rethrow for visibility.
  - Optionally Sentry.setUser/setTag with workspace/project identifiers if non-PII and helpful.

4. Shutdown/flush

- On graceful shutdown paths and fatal errors, call Sentry.flush(2000) to ensure delivery.

5. Noise control

- Only capture exceptions and important warnings (Sentry.captureMessage with level='warning') that indicate action items.

Database Strategy (Best Bang‑for‑Buck)

- Keep query/mutation modules third‑party free as per codebase conventions.
- Wrap calls in actions/routes/worker:
  - Use Sentry.startSpan with a name like db:stories:list and attributes: { area: 'stories', op: 'list', table: 'stories' }.
  - On thrown Supabase errors, capture at the boundary (action/route/worker) and add tags for op/table.
- Migrations:
  - Update migration scripts to capture failures (if run via Node/CLI scripts); otherwise log to stderr and rely on CI failure signal.
- Future (optional):
  - If using Supabase Edge Functions, add Sentry init there similarly to server code.

Source Maps & Releases

- Use withSentryConfig in next.config.js to upload source maps during build.
- Add sentry.properties with org and project; configure SENTRY_AUTH_TOKEN in CI/Vercel.
- Set a release identifier (e.g., commit SHA via env) for cross-version grouping.

CI/CD Steps

- Vercel: enable Sentry integration or set env vars; builds will upload source maps via plugin.
- Local/CI: ensure SENTRY_AUTH_TOKEN is present for production builds; skip uploads in dev.
- Validation: pnpm run validate remains unchanged; Sentry plugin should not affect type/lint.

Alerts & Ownership

- Create alert rules for:
  - New issue in production.
  - Error rate spike per service (web/worker).
- Assign ownership by path prefixes: web (src/app, src/components), worker (worker/src/\*\*), queries/mutations (tagged via boundary spans).

Runbook (Triage)

- Find issue → inspect stack trace (de-minified) → check tags (env, job, db.op/table, user id if set) → reproduce locally if needed.
- For noisy issues: adjust sampling or add beforeSend filters, or downgrade to captureMessage with warning level.
- For sensitive paths: ensure beforeSend scrubs any secrets/PII.

Rollout Plan & Checklist

M1 — Scaffold & Verify

- [ ] Add @sentry/nextjs to web; create sentry.client.config.ts and sentry.server.config.ts.
- [ ] Wrap next.config.js with withSentryConfig; add sentry.properties; configure env vars in Vercel.
- [ ] Add @sentry/node (+ profiling) to worker; initialize in worker/src/worker.ts; add unhandled handlers; basic beforeSend scrub.
- [ ] Push a test error from an API route, a client component, and a failing worker job; verify events in Sentry.

M2 — Boundary Instrumentation & Console Cleanup

- [ ] Replace console.\* in app code with captureException/captureMessage or remove; surface errors via UI.
- [ ] Add spans around key server actions/routes (auth, pricing, stories) and worker jobs (ingest, extract, analyze).
- [ ] Tag spans with db.operation/table where applicable; do not modify query/mutation modules.

M3 — Performance & Sampling Tune

- [ ] Enable tracesSampleRate 0.1 (web & worker); adjust if volume is high/low.
- [ ] Optionally enable profilesSampleRate (worker) at 0.05; tune or disable based on noise.
- [ ] Add ownership rules and two alert policies (new issue, spike).

M4 — Nice‑to‑Haves (Optional)

- [ ] Edge runtime support (sentry.edge.config.ts) if needed.
- [ ] Add a small dev-only debug helper for client logs that no-ops in production.
- [ ] Enrich spans with correlation IDs for pipeline items (e.g., storyId, sourceUrl hash).

Acceptance Criteria

- Web and worker errors appear in Sentry with readable stack traces (source maps working), correct environment, and release tags.
- At least three critical flows have spans: API route (webhook), one server action, and one worker job.
- No console.\* usage remains in app code; client errors show user feedback and are captured.
- Alert rules exist and route to the appropriate owner/team.

Open Questions

- Do we want to attach user context (id/email) by default on server? If yes, confirm PII policy.
- Which flows deserve permanent spans beyond boundaries (e.g., YouTube pipeline sub-steps)?
- Should we gate Sentry entirely in local dev to avoid noise, or keep enabled for manual tests?

Sizing (Best‑Effort)

- M1: ~1–2 hours (add SDKs/configs, envs, smoke test).
- M2: ~2–4 hours (boundary instrumentation in key files + remove consoles).
- M3: ~1 hour (sampling, alerts, ownership).
- Optional (M4): 1–2 hours depending on depth.
