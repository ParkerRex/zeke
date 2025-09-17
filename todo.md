# ZEKE Monorepo Action Plan

This consolidated plan combines the highest-impact work from the prior checklists in `todo.md`, `apps/app/todo.md`, `apps/web/todo.md`, and `apps/worker/todo.md`. Each section is ranked with the ICE method (Impact, Confidence, Ease) so the team can pick the most valuable next steps quickly.

## Entire Project

| Step Description | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Score |
| --- | --- | --- | --- | --- |
| Lock down branch workflows: switch default to `dev`, enforce `main` protections, and wire Codex/Augment auto-reviews | 8 | 8 | 7 | 7.7 |
| Stand up production hosting: create Vercel projects for app & marketing with working build/ignore commands | 9 | 6 | 5 | 6.7 |
| Centralize secrets: validate all env vars across Vercel, Railway, Supabase, and document owner of each | 8 | 7 | 5 | 6.7 |
| Ship worker on Railway with verified subdomain, health checks, and API URL wiring | 8 | 6 | 4 | 6.0 |
| Build shared monitoring & incident response (alerts, dashboards, rollback runbooks) | 7 | 6 | 5 | 6.0 |
| Finalize go-live compliance checklist (security reviews, data retention, comms plan) | 7 | 5 | 5 | 5.7 |

## App (`apps/app`)

| Step Description | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Score |
| --- | --- | --- | --- | --- |
| Repair Vitest + CI pipeline so unit/integration suites and coverage reporting run reliably | 10 | 7 | 4 | 7.0 |
| Add critical Supabase indexes and query tuning for story fetching/rate limiting | 9 | 6 | 5 | 6.7 |
| Harden Stripe webhook endpoint with scoped rate limit, audit logging, and redacted errors | 8 | 6 | 5 | 6.3 |
| Validate authentication flows end-to-end (login, signup, OAuth callback, session persistence) | 8 | 5 | 5 | 6.0 |
| Expand API route & component test coverage to catch regressions automatically | 7 | 6 | 4 | 5.7 |
| Refactor tab state management to eliminate memory bloat and giant URL payloads | 7 | 5 | 4 | 5.3 |

## Marketing Web (`apps/web`)

| Step Description | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Score |
| --- | --- | --- | --- | --- |
| Finish remaining unit tests for sidebar/layout/story sections to reach 90%+ coverage | 8 | 7 | 6 | 7.0 |
| Build integration tests for key journeys (homepage → story → signup, search, marketing nav) | 8 | 6 | 5 | 6.3 |
| Complete accessibility audit & fixes for WCAG 2.1 AA (keyboard, screen reader, contrast) | 7 | 6 | 5 | 6.0 |
| Stand up analytics stack (GA4 + PostHog) with consent banner and funnel dashboards | 7 | 5 | 4 | 5.3 |
| Optimize performance & SEO (image optimization, structured data, page metadata) | 6 | 5 | 5 | 5.3 |

## Worker (`apps/worker`)

| Step Description | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Score |
| --- | --- | --- | --- | --- |
| Expand unit test coverage for job handlers, HTTP routes, and db utilities to 90%+ | 8 | 7 | 5 | 6.7 |
| Create Railway deployment config (railway.toml, secrets) and verify staging deploy | 9 | 6 | 4 | 6.3 |
| Add dedicated GitHub Actions pipeline with lint/test/security gates and deploy automation | 8 | 6 | 5 | 6.3 |
| Build end-to-end ingestion tests (RSS, YouTube, failure recovery) with load checks | 8 | 5 | 4 | 5.7 |
| Level up logging & monitoring: structured logs, queue metrics, alerting on failures | 7 | 6 | 4 | 5.7 |
