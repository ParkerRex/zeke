## Priority Now

### P0 — Ingestion Foundations
- [ ] implement a mutation that registers a source (when new) and inserts the linked raw_item whenever a user pastes a link.
- [ ] add a mutation to drive the raw_items lifecycle (status, attempts, error payloads) as workers progress or fail.
- [ ] provide a mutation to upsert contents (transcripts, durations, language, transcript URLs, extracted timestamps).
- [ ] expose a mutation to upsert stories (canonical URL, kind, published_at, primary_url) tied to processed content.
- [ ] build a mutation to upsert story_overlays (why_it_matters, chili, confidence, citations, analyzed_at, model_version).
- [ ] add a mutation to upsert story_embeddings and maintain stories.cluster_key plus clusters.representative_story_id.

### P1 — Insight Surfaces
- [ ] create a mutation to persist chapter maps (segment titles + timestamps) for jump-link navigation.
- [ ] supply mutations to create/update/delete highlights tied to user_id, story_id, and span JSON.
- [ ] add a mutation for bookmarks / saved stories (requires introducing a bookmarks table).

### P2 — Billing & Account
- [ ] add a mutation to sync subscription status/plan metadata beyond the existing Stripe webhooks.
- [ ] add a mutation to update billing_address and payment_method from the settings UI.

## For Later

### Insight Signals
<!-- - [ ] create a mutation to store comment-intelligence summaries (themes, referenced timestamps, sentiment) per story. -->
<!-- - [ ] add a mutation to capture novelty / "what's new" detections and contradiction flags per story. -->
<!-- - [ ] add a mutation to log cross-source linkage (papers ↔ podcasts ↔ products) for the trend & research graph. -->

### Source & Pipeline Health
<!-- - [ ] add a mutation to update sources.active/metadata/last_cursor when ingestion settings change or sources pause/resume. -->
<!-- - [ ] add a mutation to upsert source_metrics (counts and last_* timestamps) after ingestion runs. -->
<!-- - [ ] add a mutation to update source_health (status, message, last success/error) from workers. -->
<!-- - [ ] create a mutation to record job_metrics and platform_quota usage for each provider refresh. -->

### User Interactions
<!-- - [ ] add a mutation to collect per-story trust feedback (accuracy/usefulness ratings, optional notes). -->
<!-- - [ ] add a mutation to store per-user role/preferences so briefs and outputs stay role-aware. -->

### Playbooks & Apply
<!-- - [ ] design mutations for user goals (create/update/archive) that feed the Apply phase. -->
<!-- - [ ] build mutations for SOP templates and team playbook library management (create, clone, retire, share). -->
<!-- - [ ] add a mutation to create Apply runs (PRDs, experiment plans, campaigns) with citation payloads and status. -->
<!-- - [ ] add a mutation to log Apply outcome metrics (was it run, success markers, next actions). -->

### Create & Publish
<!-- - [ ] add mutations for generated content artifacts (threads, posts, emails, decks) with publish state and citations. -->
<!-- - [ ] add a mutation to manage brand/style presets and tone controls per team. -->
<!-- - [ ] add a mutation to manage publishing destinations (CMS, newsletter, social, Canva) and their auth tokens. -->
<!-- - [ ] add a mutation to track publishing pipelines (draft → approved → scheduled → shipped) with timestamps. -->

### Billing & Account
<!-- - [ ] add a mutation to manage team membership and roles (invite, accept, promote/demote, remove). -->
