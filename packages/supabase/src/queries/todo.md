## Priority Now

### P0 — Link → Verified Brief
- [ ] implement a mutation that registers or reuses a source and inserts the raw_items record when a user submits a link.
- [ ] add a mutation to advance raw_items status/attempts/error payloads so the UI can reflect ingestion progress.
- [ ] create a mutation to upsert contents rows (transcripts, html/audio/pdf URLs, duration, lang, view metrics) tied to the raw item.
- [ ] provide a mutation to upsert stories (title, urls, kind, published_at, cluster_key) once content extraction finishes.
- [ ] add a mutation to upsert story_overlays with why_it_matters, chili, confidence, citations, analyzed_at, and model_version.
- [ ] add a mutation to upsert story_embeddings and maintain clusters.representative_story_id for search and grouping.
- [ ] create a mutation to persist chapter maps (segment title, summary, start/end timestamps, speaker) powering jump links.
- [ ] create a mutation to store novelty/contradiction flags per story with citation pointers for the "what's new" detector.
- [ ] add a mutation to capture performance signals (view_count snapshots, spikes, velocity vs channel median) for the heat section.
- [ ] add a mutation to persist comment intelligence (themes, referenced timestamps, sentiment) per story.
- [ ] provide a mutation to store an evidence ledger (claims, confidence, citations) backing the receipts UX.
- [ ] add a mutation to persist role-aware takeaways/actions (role, summary, next steps) surfaced in briefs.

### P0 — Apply & Create
- [ ] add a mutation to create/update user and team goals plus SOP selections that feed the Apply flow.
- [ ] add a mutation to capture Apply outputs (playbooks, experiment plans, briefs) with citations, status, and source linkage.
- [ ] add a mutation to capture generated content artifacts (threads, posts, emails) with provenance and publish status.
- [ ] add a mutation to log user feedback/trust ratings on generated outputs (accuracy, usefulness, notes).
- [ ] add a mutation to manage brand/style presets and tone controls referenced during creation.
- [ ] add a mutation to manage publish destinations (newsletter, CMS, social) and their auth tokens for one-click shipping.

### P0 — Account & Access
- [ ] add a mutation to manage team membership and roles (invite, accept, promote/demote, remove) that aligns with cached queries.
- [ ] add a mutation to sync subscription status and plan metadata from Stripe webhooks into Supabase.
- [ ] add a mutation to update billing profile fields (billing_address, payment method metadata) surfaced via getUserQuery.
- [ ] add a mutation or trigger hook to invalidate cached getUser/getSession data (revalidateTag for user cache keys).

## Later

### Trend & Research Graph
- [ ] add a mutation to upsert entity/claim graph nodes and edges linking people, labs, datasets, models, and companies.
- [ ] add a mutation to record cross-source linkages (story → story → product) for diffusion tracking.
- [ ] add a mutation to log longitudinal benchmark results extracted from papers (dataset, metric, score, publication date).
- [ ] add a mutation to store hype-vs-reality scores and contradiction heatmaps for announcements.

### Applied Automation
- [ ] add a mutation to define runnable experiments (prompt, dataset, eval plan) generated from findings.
- [ ] add a mutation to log experiment execution results, status, and telemetry for applied automation.
- [ ] add a mutation to capture weekly role-based brief deliveries and engagement metrics (opens, clicks).

### Trust & Governance
- [ ] add a mutation to maintain provenance badges per artifact (sources, timestamps, model version, policy compliance).
- [ ] add a mutation to enforce publication policies (e.g. require two citations) and record approvals / overrides.
- [ ] add a mutation to capture per-story trust feedback (accuracy rating, flagged issues, reviewer).

### Platform & Ecosystem
- [ ] add a mutation to manage API/SDK tokens and usage quotas for partner integrations.
- [ ] add a mutation to manage community playbook marketplace submissions, reviews, and moderation status.
- [ ] add a mutation to manage browser/inbox sidecar session tokens and settings.

### Observability & Metrics
- [ ] add a mutation to update source_metrics and source_health after ingestion runs complete.
- [ ] add a mutation to record job_metrics and platform_quota updates per provider refresh.
- [ ] add a mutation to log product analytics (time-to-brief, apply rate, publish rate) per user/team for dashboards.
