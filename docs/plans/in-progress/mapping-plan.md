# Midday-to-Zeke Mapping Plan

## Purpose
- Document how each critical Midday feature or architectural pattern should translate into Zeke’s primitives and workflows.
- Surface current implementation gaps in Zeke where Midday assumptions (transactions, bank accounts, invoicing) still exist.
- Create a phased action plan to realign the codebase with Zeke’s business logic (Stories, Sources, Insights, Briefs, Playbooks).

## Guiding Principles
- **Keep naming consistent with Zeke**: Sources, Stories, Insights, Briefs, Playbooks.
- **Favor reuse over rewrites**: lift Midday components/patterns when they apply, but strip finance-specific logic.
- **Tie every ingest to an Insight**: no raw source should land without an eventual highlight/insight attachment.
- **Automate with Playbooks**: Trigger.dev pipelines become user-facing, repeatable automations.

## Feature Mapping Overview
- Import Modal → Source Intake
- Magic Inbox → Source Inbox
- Vault → Source Library
- Transactions → Insights (Highlights)
- Reports → Briefs
- AI Assistant & Filters → Insight Assistant
- Ingestion Workflows → Playbooks
- Matching Engine → Source↔Insight Linking
- Team/Access Patterns → Multi-tenant Source Governance

## Detailed Mappings

### Import Modal → Source Intake
- **Midday baseline**: `apps/dashboard/src/components/modals/import-modal` uses `importTransactionsAction` and Trigger.dev `import-transactions` to upsert `transactions` and embed them.
- **Zeke reality**: UI copied, action missing, job still writes to `transactions` (`packages/jobs/src/tasks/transactions/import.ts`).
- **Gaps**:
  - Schema still expects bank accounts/currencies.
  - Resulting data never populates `sources` or `raw_items` tables.
  - No safe-action or router under `@/actions/sources`.
- **Target state**:
  - Rename flow to “Add Source”.
  - Replace transaction mapping with source metadata normalization (type detection, channel, tags).
  - Persist uploads into `sources`, `source_connections`, and `raw_items`; enqueue enrichment playbook.
  - Update modal copy, validation, and status polling to align with Sources.
- **Next actions**:
  1. Author `importSourceAction` safe action + tRPC router.
  2. Refactor Trigger.dev task to call source ingestion pipeline (no `transactions` table).
  3. Rework UI (fields, strings) to drop finance-specific assumptions.

### Magic Inbox → Source Inbox
- **Midday baseline**: Trigger.dev `process-attachment` + inbox UI automatically classifies receipts, embeds, and matches to transactions.
- **Zeke reality**: Same job exists but retains invoice/tax fields and calls transaction matching; inbox UI not exposed under Source naming.
- **Gaps**:
  - Inbox records not surfaced as Sources; schema still invoice-centric.
  - Matching stage points to transactions instead of highlights.
  - No Source Inbox navigation/branding.
- **Target state**:
  - Rebrand inbox components to “Source Inbox”.
  - Update job to create Source entries + attach to existing stories/highlights using embeddings.
  - Provide UI to triage incoming sources, trigger playbooks, and confirm insight linkage.
- **Next actions**:
  1. Define Source Inbox schema adjustments (status enums, metadata).
  2. Swap matching call to an Insight linking service (see Matching section).
  3. Ship Source Inbox page and admin tools under new naming.

### Vault → Source Library
- **Midday baseline**: Vault UI lists documents from Supabase storage, with filters, tags, uploads.
- **Zeke reality**: Vault components intact; `sources` tables unused by UI; copy still references financial documents.
- **Gaps**:
  - No unified Source browsing experience.
  - Documents lack linkage UI to stories/insights.
  - Team scoping still bank-account oriented.
- **Target state**:
  - Source Library surfaces `raw_items`/`sources` with filters (type, authority, tags, linked insights).
  - Upload zone pipelines into Source ingestion playbooks.
  - Provide detail panel linking Sources ↔ Highlights ↔ Stories.
- **Next actions**:
  1. Replace Vault data hooks with Source queries.
  2. Rename components/routes and update copy.
  3. Add inline actions (link to story, mark as key insight, run playbook).

### Transactions → Insights (Highlights)
- **Midday baseline**: Transactions table rich schema, status/matching flows, attachments.
- **Zeke reality**: `highlights` table models insights but ingestion still populates `transactions`; no highlight creation pipeline.
- **Gaps**:
  - No CRUD or automation to create/update highlights from sources or assistant output.
  - UI references “transactions” in some admin tools.
  - Matching logic missing for linking sources to highlights/stories.
- **Target state**:
  - Use highlights as the canonical insight entity (status, confidence, citations).
  - Build actions/routers around highlight lifecycle (create from source, promote from assistant, review states).
  - Implement automatic dedupe/matching (source embeddings, metadata heuristics).
- **Next actions**:
  1. Design highlight creation service invoked by ingestion/playbooks.
  2. Port Midday matching algorithm concepts to insight linking (see Matching section).
  3. Update dashboard/admin consoles to surface highlights lists & statuses.

### Reports → Briefs
- **Midday baseline**: Reports modules aggregate transactions into charts & summaries (revenue, profit, burn).
- **Zeke reality**: No Brief schema or UI; reports references absent beyond marketing material.
- **Gaps**:
  - No aggregation queries over highlights/stories.
  - No templating for briefs (executive summary, “why it matters”).
  - Assistant doesn’t generate structured briefs.
- **Target state**:
  - Introduce Brief entity tied to stories/goals, storing sections, citations, generated outputs.
  - Reuse chart/timeframe selector patterns for insight metrics.
  - Allow one-click brief generation via playbooks or assistant prompts.
- **Next actions**:
  1. Define Brief schema + Supabase tables.
  2. Build aggregation endpoints (insights grouped by topic/time/goal).
  3. Create brief builder UI with templates + live citations.

### AI Assistant & Filters → Insight Assistant
- **Midday baseline**: Assistant interacts with transactions/inbox, generates filters, allows save actions.
- **Zeke reality**: Assistant shells exist tied to stories/highlights but ingestion context still transaction-heavy.
- **Gaps**:
  - Retrieval index needs to prioritize Sources & Highlights.
  - No “save as insight” flow from assistant responses.
  - Tool panels still named for documents/inbox.
- **Target state**:
  - Assistant pipeline uses Source/Highlight embeddings, surfaces citations.
  - Provide quick actions to create highlights, add to briefs, or trigger playbooks.
  - Update tool names to Source Library / Source Inbox within assistant panel.
- **Next actions**:
  1. Rebuild retrieval layer using Source/Highlight vectors.
  2. Add mutation to persist assistant answers as highlights.
  3. Align assistant UI copy with Zeke primitives.

### Ingestion Workflows → Playbooks
- **Midday baseline**: Trigger.dev tasks orchestrate ingestion (CSV import, inbox processing, matching) with ad-hoc status polling.
- **Zeke reality**: Same tasks exist but no Playbook abstraction; `useSyncStatus` still transaction-focused.
- **Gaps**:
  - Users can’t configure or re-run pipelines.
  - Status updates aren’t unified; admin console lacks Playbook visibility.
- **Target state**:
  - Define Playbook entity (config + steps) and PlaybookRun history.
  - Wrap Trigger.dev jobs with Playbook orchestrators emitting status/events.
  - Provide dashboard for launching, monitoring, and reusing playbooks (e.g., “Research Feed Sync”, “Brief Generator”).
- **Next actions**:
  1. Model Playbooks + runs in DB.
  2. Refactor tasks to register runs & progress events.
  3. Build UI (admin + end-user) for launching/playback.

### Matching Engine → Source ↔ Insight Linking
- **Midday baseline**: Bidirectional matching (transactions ↔ inbox) using embeddings + heuristics.
- **Zeke reality**: Matching references remain, but target is transactions; no insight dedupe/auto-linking.
- **Gaps**:
  - Need new heuristics for linking sources to highlights/stories.
  - Calibration/feedback loop absent for insights.
- **Target state**:
  - Adapt matching engine to operate on (source content ↔ highlight summary ↔ story context).
  - Store feedback (confirm/dismiss) to adjust thresholds per team/topic.
  - Surface suggested insights for review before promotion.
- **Next actions**:
  1. Spec new matching schema (suggestions, feedback, confidence).
  2. Port Midday’s scoring system to operate on insight metadata.
  3. Integrate with Source Inbox triage + assistant save flow.

### Team & Access Patterns → Multi-tenant Source Governance
- **Midday baseline**: Team-scoped RLS across transactions, vault, inbox.
- **Zeke reality**: Teams exist, but new tables (sources, highlights) need comprehensive RLS + admin tooling.
- **Gaps**:
  - Review RLS on sources/raw_items/highlights to match Midday strictness.
  - Ensure signed URL handling consistent with Source library.
- **Next actions**:
  1. Audit Supabase policies for new tables.
  2. Align storage bucket paths with team scoping.
  3. Update admin console to manage permissions & source visibility.

## Phasing
1. **Schema & Action Foundations**
   - Ship Source import action, highlight creation APIs, playbook schema groundwork.
2. **Source Experience**
   - Rebrand Vault/Inboxes, deliver Source Library + Inbox UI fed by new pipelines.
3. **Insight Lifecycle**
   - Auto-generate highlights from ingestion, implement matching feedback loops, integrate assistant save.
4. **Briefs & Narratives**
   - Introduce brief builder, chart aggregations, story-first dashboards.
5. **Playbooks & Automation**
   - Wrap all ingestion/enrichment flows in Playbooks with monitoring + user triggers.
6. **Polish & Governance**
   - Tighten RLS, telemetry, and admin tooling; document new workflows.

## Immediate TODOs
- Replace transaction import references with source-focused code paths.
- Draft highlight creation/matching service design.
- Plan Supabase migrations for Sources/Highlights/Playbooks tables and policies.
- Update dashboard copy + navigation to reflect new primitives.
