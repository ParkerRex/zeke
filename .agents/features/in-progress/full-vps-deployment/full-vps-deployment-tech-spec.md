# Full VPS Deployment Tech Spec

## Overview
We will migrate all Zeke services (dashboard, website, public API, ingestion engine) to run on a single Netcup VPS. All services will be containerized and orchestrated with Docker Compose. A reverse proxy will manage TLS termination, routing, and zero-downtime reloads. The goal is to deliver a reproducible, secure production deployment that matches staging environments and supports future scaling.

## Goals
- Containerize dashboard (Next.js), marketing website (Next.js), API (Bun + Hono), ingestion engine (currently Cloudflare Worker) for VPS hosting.
- Provide separate staging and production deployments on the VPS with isolated configuration.
- Centralize SSL termination, routing, and certificate automation via reverse proxy.
- Ensure OAuth (Google) + Supabase redirects work for both staging and production domains.
- Provide operational scripts/process for deploys, log collection, restarts, and updates.

## Non-Goals
- Rewriting application business logic beyond deployment necessities.
- Autoscaling across multiple VPS instances.
- Refactoring Supabase or database stacks.
- Replacing third-party services like Supabase, Resend, Stripe.

## Assumptions
- Netcup VPS has root SSH access with Docker and Docker Compose support.
- DNS for `zekehq.com` and subdomains can be pointed at the VPS.
- Supabase project stays unchanged; environment secrets available.
- Supabase staging will share the primary hosted project (no separate Supabase instance).
- VPS has sufficient CPU/RAM for all services (8 GB+ recommended).

## Architecture
- **Reverse Proxy:** Caddy v2 runs in front of all services. Handles HTTP->HTTPS redirects, TLS via Let’s Encrypt, rate limiting, request logging.
- **Applications:**
  - `dashboard`: Next.js (port 3001) served via `next start`. Domains: `app.zekehq.com` (prod), `app-staging.zekehq.com` (staging).
  - `website`: Next.js (port 3000) served via `next start`. Domains: `zekehq.com` and `www.zekehq.com` (prod), `staging.zekehq.com` (staging).
  - `api`: Bun/Hono service (port 3003) served via compiled output. Domain: `api.zekehq.com` (prod), `api-staging.zekehq.com` (staging).
  - `engine`: Convert Worker to Bun/Hono service running behind proxy (port 3010). Domain: `engine.zekehq.com` (prod), `engine-staging.zekehq.com` (staging).
- **Data Stores:**
  - Redis container (existing compose file) for caching/queues if required.
  - Bind to Supabase via environment vars.
- **Networking:** All containers on a shared Docker network; reverse proxy attaches to public network and internal network.
- **Configuration:** Environment files per service/per environment (stored under `deploy/env/*`). Secrets injected via Docker Compose `.env` or Docker secrets; never committed.

## Functional Requirements
1. Provide staging deployment reachable via `*.vercel.app` equivalent subdomains on VPS; environment var `NEXT_PUBLIC_URL` must match domain.
2. Production deployment reachable via real domains with valid TLS certificates.
3. Compose file(s) support `staging` and `production` profiles.
4. Caddy automatically provisions/renews TLS certificates from Let’s Encrypt.
5. Applications can access Supabase, Redis, and other services with minimal downtime.
6. Engine service must expose `/health`, `/ingest`, `/source`, `/` endpoints identical to Worker behavior.
7. Deploy process documented: build images, push/pull, rolling restart commands.
8. Monitoring/logging guidelines with instructions for verifying container health.

## Technical Constraints
- Use Docker Compose v2 syntax.
- Use Bun 1.2.x base images where needed; Node 20 for Next.js builds.
- Minimize image size via multi-stage builds.
- Compose must run behind Caddy with TLS challenges solved via HTTP-01 (port 80 open).
- Provide healthchecks for each service container.

## Integrations
- Supabase (env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`) shared between staging and production.
- Google OAuth client (env: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, etc.) with redirect URIs updated for new domains.
- Resend (email) keys for API/website.
- Stripe (billing) env vars for dashboard/API.

## Success Metrics
- [Traffic] HTTPS endpoints for each subdomain return 200 responses.
- [Auth] Google OAuth completes without login loop on staging and production.
- [Deployability] New git commit can be deployed using documented procedure in < 15 minutes.
- [Reliability] Containers auto-restart on failure and expose healthcheck endpoints returning healthy.

## Risks
- Misconfigured TLS or DNS causing downtime.
- Resource exhaustion on single VPS.
- Conversion of engine to Node service may introduce regressions without Worker bindings.
- Secret management on VPS without vault system.

## Open Questions
- Whether to maintain separate Docker Compose files for staging vs production or use profiles.
- Need for centralized logging/metrics (Prometheus/Grafana?) — to be scoped later.
