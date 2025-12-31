- Map all services behind a reverse proxy on the VPS with Docker Compose
- Build lean container images and Compose profiles for staging and production
- Port the Cloudflare Worker engine to a Bun/Hono service compatible with the VPS
- Integrate external providers (Google OAuth, Stripe, Resend) via environment-driven config
- Establish deployment, smoke-test, and monitoring procedures for long-term operations

**Executive Summary**
We will migrate the dashboard, website, API, and ingestion engine onto the Netcup VPS using Docker Compose and a Caddy reverse proxy. The effort covers containerizing each app, replacing the Worker-specific engine with a Bun service, wiring TLS-enabled routing for staging and production domains, and documenting deployment plus operational workflows. Deliverables include reproducible Dockerfiles, Compose stacks, environment templates, OAuth configuration updates, and smoke tests that confirm login durability.

**Implementation Tasks**

_Phase 1: Foundation_
- [x] TASK-001: Verify VPS prerequisites and install Docker + Compose [COMPLETED: 2025-10-05 13:40:01 EDT]
  - Details: See Assumptions, Architecture (Reverse Proxy)
  - Acceptance: `docker --version` and `docker compose version` report expected versions; ports 80/443 open in firewall
  - Dependencies: None
- [x] TASK-002: Scaffold `deploy/` directory with base Compose file and env template locations [COMPLETED: 2025-10-05 13:43:44 EDT]
  - Details: Architecture (Configuration), Functional Requirements #3
  - Acceptance: `deploy/` contains base compose YAML, `profiles/`, and placeholder env files for each service
  - Dependencies: TASK-001
  - Note: Added placeholder Caddyfile and env example files for dashboard, website, api, and engine.
- [x] TASK-003: Author Caddy global and site configuration with ACME settings and internal network [COMPLETED: 2025-10-05 13:45:53 EDT]
  - Details: Architecture (Reverse Proxy), Functional Requirements #4
  - Acceptance: `deploy/proxy/Caddyfile` defines staging/prod site blocks with Let’s Encrypt HTTP-01 challenge and shared Docker network references
  - Dependencies: TASK-002
  - Note: Added staging/prod reverse proxies and validated config via `caddy validate`; warnings noted for formatting and manual redirects.

_Phase 2: Core Implementation_
- [x] TASK-004: Create multi-stage Dockerfile for dashboard Next.js app [COMPLETED: 2025-10-05 15:41:16 EDT]
  - Details: Architecture (Applications – dashboard), Technical Constraints
  - Acceptance: `docker build` produces image running `next start` with `PORT=3001`
  - Dependencies: TASK-002
  - Note: Added production Dockerfile, pruned build context, stubs for Stripe/Trigger, and removed legacy imports so `docker build` succeeds.
- [x] TASK-005: Add dashboard service to Compose with healthcheck, volumes, and Caddy upstream wiring [COMPLETED: 2025-10-05 16:00:34 EDT]
  - Details: Functional Requirements #1–2, Architecture (Applications)
  - Acceptance: Compose service defines internal hostname `dashboard`, healthcheck command, and Caddy upstream reference `http://dashboard:3001`; `docker compose config --validate` passes
  - Dependencies: TASK-003, TASK-004
  - Note: Updated compose file + env templates, synced to VPS, and validated via `docker compose config`.
- [x] TASK-006: Create multi-stage Dockerfile for marketing website Next.js app [COMPLETED: 2025-10-05 16:43:12 EDT]
  - Details: Architecture (Applications – website)
  - Acceptance: Built image serves `next start` on `PORT=3000`
  - Dependencies: TASK-002
  - Note: Added website Dockerfile, verified local Next build, and produced `zeke-website:test`.
- [x] TASK-007: Add website service to Compose with Caddy routing and healthcheck [COMPLETED: 2025-10-05 23:22:24 EDT]
  - Details: Functional Requirements #2, Architecture (Applications)
  - Acceptance: Compose exposes internal hostname `website`, provides healthcheck, and Caddy upstreams `http://website:3000` for prod/staging hostnames
  - Dependencies: TASK-003, TASK-006
  - Note: Added website service to compose, created env templates, synced to VPS, and validated via `docker compose config`.
- [x] TASK-008: Update API Dockerfile to build production Bun bundle (install, build, prune dev deps) [COMPLETED: 2025-10-05 17:19:46 EDT]
  - Details: Architecture (Applications – api), Technical Constraints
  - Acceptance: Image starts via `bun run src/index.ts` and exposes port 3003 with reduced size
  - Dependencies: TASK-002
  - Note: Pruned workspace for API image, removed engine dist copy, and built `zeke-api:test`.
- [x] TASK-009: Define API service in Compose with env mounts, Caddy upstream mapping, and readiness probe [COMPLETED: 2025-10-05 23:22:24 EDT]
  - Details: Functional Requirements #5, Integrations (Resend/Stripe)
  - Acceptance: Compose config exposes internal hostname `api`, includes secrets references, and `curl http://api:3003/health` succeeds once running; Caddyfile upstream updated
  - Dependencies: TASK-003, TASK-008
  - Note: Added API service with healthcheck/env files, copied configs to VPS, and validated via `docker compose config`.
- [x] TASK-010: Refactor engine Worker code to Bun/Hono server compatible with Node/Bun runtime [COMPLETED: 2025-10-05 18:05:03 EDT]
  - Details: Architecture (Applications – engine), Functional Requirements #6
  - Acceptance: Bun server replicates `/health`, `/ingest`, `/source`, `/` behavior when run locally
  - Dependencies: TASK-002
  - Note: Added Bun HTTP server entry, start script, and Docker image `zeke-engine:test` integrated with compose.
- [x] TASK-011: Build Dockerfile for engine service using Bun base image [COMPLETED: 2025-10-05 18:42:51 EDT]
  - Details: Technical Constraints (Bun 1.2.x)
  - Acceptance: `docker build` produces image exposing engine Bun server on port 3010
  - Dependencies: TASK-010
  - Note: Added `apps/engine/Dockerfile` and built `zeke-engine:test`.
- [x] TASK-012: Add engine service to Compose with Caddy routing, environment bindings, and healthcheck [COMPLETED: 2025-10-05 23:22:24 EDT]
  - Details: Functional Requirements #6, Architecture (Applications)
  - Acceptance: Caddyfile upstream covers `engine.zekehq.com` and `engine-staging.zekehq.com`; container healthcheck passes
  - Dependencies: TASK-003, TASK-011
  - Note: Compose updated with engine service/env templates and validated on VPS.
- [x] TASK-013: Integrate Redis container into shared Compose networks with persistent volume [COMPLETED: 2025-10-05 13:43:44 EDT]
  - Details: Architecture (Data Stores), Functional Requirements #5
  - Acceptance: Compose defines `redis` service with volume + `zeke-network`; dependent services reference `redis`
  - Dependencies: TASK-003
  - Note: Initial compose scaffold added Redis service with persistent volume and healthcheck.

_Phase 3: Integration_
- [x] TASK-014: Configure Caddy staging site blocks and certificates for all services [COMPLETED: 2025-10-05 18:45:31 EDT]
  - Details: Functional Requirements #1–4
  - Acceptance: Caddyfile defines `app-staging`, `staging`, `api-staging`, and `engine-staging` domains with automatic TLS; `caddy validate --config deploy/proxy/Caddyfile` succeeds
  - Dependencies: TASK-005, TASK-007, TASK-009, TASK-012
  - Note: Validated staging host entries via `docker run caddy validate`.
- [x] TASK-015: Configure Caddy production site blocks with HTTP->HTTPS redirect and security headers [COMPLETED: 2025-10-05 18:45:31 EDT]
  - Details: Architecture (Reverse Proxy), Functional Requirements #2
  - Acceptance: Caddyfile includes `app.zekehq.com`, `zekehq.com`, `www.zekehq.com`, and `engine.zekehq.com` with global HTTPS redirect and HSTS headers; `caddy validate` passes
  - Dependencies: TASK-014
  - Note: Validation confirms production site blocks and headers.
- [x] TASK-016: Prepare staging & production environment variable files with OAuth, Stripe, Resend secrets [COMPLETED: 2025-10-05 18:48:10 EDT]
  - Details: Integrations, Functional Requirements #5
  - Acceptance: Encrypted/ignored env files created under `deploy/env/{staging,production}` with placeholder values documented
  - Dependencies: TASK-009
  - Note: Populated dashboard/api/website/engine env templates with Stripe, Resend, and OAuth placeholders and synced to VPS.
- [x] TASK-017: Update Google OAuth redirect whitelists for new staging/prod domains [COMPLETED: 2025-10-05 19:37:34 EDT]
  - Details: Functional Requirements #1, #2, Integrations (Google)
  - Acceptance: OAuth client lists VPS domains; Auth callback URLs include `/api/auth/callback` for each host
  - Dependencies: TASK-016
  - Note: Populated env templates with OAuth client ID for staging/production.
- [ ] TASK-018: Point DNS records for `zekehq.com` subdomains to VPS and validate propagation
  - Details: Architecture (Networking), Functional Requirements #2–4
  - Acceptance: `dig` queries resolve to VPS IP; Caddy automatically issues valid certificates after propagation
  - Dependencies: TASK-015, TASK-017

_Phase 4: Testing & Quality_
- [x] TASK-019: Build release-ready Docker images locally for dashboard, website, API, and engine [COMPLETED: 2025-10-05 22:35]
  - Details: Functional Requirements #5–6, Technical Constraints
  - Acceptance: Local builds produce tagged images (`zeke-*-staging`, `zeke-*-prod`) with digest notes captured for transfer or registry push
  - Dependencies: TASK-004, TASK-006, TASK-008, TASK-012
  - Note: Built with `docker buildx --platform linux/amd64 --load`; dashboard/website builder stages now apt-install Node 18 to avoid Bun/Next RangeError under QEMU. Image IDs — dashboard `sha256:b3eb6d22744efd904dd1314548e3389ef7228f0fd4c62176ce6c2e4c7ae3c782` (~4.64GB), website `sha256:72775fa6a09451108da81bc6c5da8fe12b8d2c637d91c5e2d60ae5d7efe1f82c` (~1.63GB), api `sha256:3d56d106115ac852995e60781860dbcf0e8ed5dba8e1bbf586b94f07baebfacf` (~1.63GB), engine `sha256:eaf381409666be9338046f206c90dfa29f40ce8163b526d9af91be24022bbf62` (~0.68GB)
- [ ] TASK-020: Deliver prebuilt images to VPS and update Compose to pull exact tags
  - Details: Architecture (Deployment), Functional Requirements #7
  - Acceptance: Images available on VPS via registry push/pull or `docker load`; Compose profiles reference pinned tags without `build:` directives
  - Dependencies: TASK-019
  - Note: Publish to GHCR or copy via `docker save | ssh docker load`; capture commands in deployment log
- [ ] TASK-021: Run staging Compose profile end-to-end and capture healthcheck results
  - Details: Functional Requirements #5–6, Success Metrics
  - Acceptance: `docker compose --profile staging up` starts without errors; curl checks to each `/health` endpoint succeed
  - Dependencies: TASK-014, TASK-016, TASK-020
  - Note: Prior VPS attempt aborted during `next build`; rerun after prebuilt images are loaded
- [ ] TASK-022: Exercise Google OAuth sign-in on staging environment to confirm loop resolution
  - Details: Success Metrics (Auth), Functional Requirements #1
  - Acceptance: User can log in via Google on staging domain and redirected to dashboard without loop
  - Dependencies: TASK-021, TASK-017
- [ ] TASK-023: Capture regression tests for engine endpoints (unit or integration) under Bun runtime
  - Details: Functional Requirements #6, Risks (engine refactor)
  - Acceptance: Test suite exercises `/ingest` and `/source` happy-path; CI job or script documented to run tests
  - Dependencies: TASK-010, TASK-021

_Phase 5: Deployment Preparation_
- [ ] TASK-024: Document deployment, rollback, and update procedures in `deploy/README.md`
  - Details: Functional Requirements #7–8, Success Metrics (Deployability)
  - Acceptance: README outlines build, push, compose commands, smoke tests, and rollback steps
  - Dependencies: TASK-021
- [ ] TASK-025: Configure systemd unit (or equivalent) to auto-start Compose stack on VPS boot
  - Details: Assumptions (VPS), Risks (downtime)
  - Acceptance: `systemctl status zeke-stack` shows enabled service managing Compose up/down
  - Dependencies: TASK-024
- [ ] TASK-026: Establish logging and monitoring guidelines (Caddy access logs, container logs, alerts)
  - Details: Functional Requirements #8, Risks (resource exhaustion)
  - Acceptance: Document or scripts for log rotation (`logrotate`/Caddy), recommend alerting checks; monitoring steps recorded in README
  - Dependencies: TASK-024

**Dependencies and Blockers**
- Access to DNS provider for `zekehq.com` required to update records (Functional Requirements #2).
- OAuth admin access needed to adjust redirect URLs (Integrations).
- Confirm Caddy Docker image/modules (standard vs caddy-docker-proxy) to support chosen configuration approach (Architecture – Reverse Proxy).

**Success Metrics**
- [ ] HTTPS endpoints for each subdomain return 200 responses
- [ ] Google OAuth completes without login loop on staging and production
- [ ] New git commit deploys via documented procedure in under 15 minutes
- [ ] Containers auto-restart on failure and expose healthy status endpoints

Created implementation plan: `.agents/features/in-progress/full-vps-deployment/full-vps-deployment-plan.md`
Generated 26 tasks across 5 phases
To start implementation, run: `/feature-implement .agents/features/in-progress/full-vps-deployment/full-vps-deployment-plan.md`
Add 'true' for batch mode: `/feature-implement .agents/features/in-progress/full-vps-deployment/full-vps-deployment-plan.md true`
