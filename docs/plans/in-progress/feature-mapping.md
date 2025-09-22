# Midday-to-Zeke Feature Mapping

This document maps key features of the Midday open-source project to the Zeke platform's core primitives-Stories, Sources, Insights, Briefs, and Playbooks-and outlines how to adapt or rename them. It also highlights architectural patterns from Midday (tRPC structure, Supabase usage, modal flows, sync jobs) that Zeke can emulate. All mappings cover both UI components and backend/data alignment.

## Feature Mappings

### Import Modal (CSV Import for Transactions) -> Sources (Data Ingestion)
**Description / Justification**
Midday's import modal allows users to upload a CSV of bank transactions, acting as an entry point for external data. This aligns with Sources in Zeke, which represent incoming raw information. The multi-step import flow (file selection, field mapping, confirmation) mirrors adding a new source of data.

**Implementation Notes**
- Reuse Midday's multi-stage modal design for "Add Source," e.g., a Source Import Modal with steps: select file/type -> map fields -> confirm import.
- Create a server action such as `importSourceAction`, modeled after Midday's `importTransactionsAction`, to handle file upload and processing, store files in Supabase, and trigger an ingestion job.
- Leverage URL query parameters (for example, `?step=import`) to control modal state, enabling deep links and state persistence.

### Magic Inbox (Automated Receipt Inbox) -> Sources (Ingestion Pipeline)
**Description / Justification**
Midday's Magic Inbox automatically ingests incoming invoices/receipts and matches them to transactions. In Zeke, this concept maps to Sources handling automated input feeds-an inbox of raw source materials (emails, files, etc.) that are processed upon arrival. The Magic Inbox performs OCR and classification on documents, akin to Zeke ingesting and analyzing source content on arrival.

**Implementation Notes**
- Introduce a Source Inbox in Zeke where users can forward emails or upload files to a unique inbox address or folder.
- Use background jobs to extract text, classify content, and link sources to relevant insights or stories; Midday's upload -> OCR -> match pipeline can serve as a baseline playbook.
- Support the inbox via a dedicated table and tRPC router to manage incoming records and their processing status. Rename "Magic Inbox" to Source Inbox or Imports for clarity.

### Vault (Document Storage & UI) -> Sources (Document Library)
**Description / Justification**
Midday's Vault is a secure file repository for important documents (contracts, receipts, etc.). This corresponds to Zeke's Sources library-a central place to store and browse all source documents. In Midday, uploaded documents reside in a Supabase `vault` bucket organized by team. The Vault UI (grid/list, tags, search) lets users manage files; Zeke needs a comparable document library for source materials.

**Implementation Notes**
- Repurpose Midday's Vault module as Zeke's Source Library, including list, filter, and tag components with updated naming.
- Mirror Midday's document schema and tRPC router for CRUD operations on sources, keeping Supabase storage conventions for pathing and access.
- Preserve linking capabilities so source files can attach to Insights or Stories, similar to how Midday ties documents to transactions.

### Transactions (Financial Records & Matching) -> Insights (Discrete Findings or Internal Data Model)
**Description / Justification**
Midday's transactions are granular financial records enriched by matching receipts. Even if Zeke does not handle bank data, an Insight can be treated similarly: an atomic piece of information with metadata linked to source evidence. Transaction status (unmatched/matched) parallels an insight's validation or review state.

**Implementation Notes**
- Adopt a transaction-like schema for insights, with fields for content, source references, tags, and status.
- Use Midday's transaction router and matching logic as guidance for linking insights to source documents (akin to `transaction_attachments`).
- Apply Midday's patterns-Zod schemas and routers-for insight creation and consider automated matching to connect new sources with existing insights or stories.

### Reports (Financial Overview & Analytics) -> Briefs (Compiled Reports)
**Description / Justification**
Midday's reports module generates summaries of financial data. This equates to Zeke's Briefs: compiled reports or synthesized narratives built from insights. Once data is reconciled, Midday enables powerful reporting; Zeke's Briefs deliver similar higher-level aggregation.

**Implementation Notes**
- Use Midday's reports UI as a template for a Brief viewer/editor combining prose with visualizations.
- Back the feature with queries that aggregate source-derived insights, mirroring how Midday composes reports from transactions and documents.
- Supply brief templates inspired by Midday's predefined report types, enabling save/edit flows and potentially collaborative sharing similar to Midday's invoicing work.

### AI Assistant & Insights (Tailored Analysis) -> Insights (AI-Generated or Query-Driven)
**Description / Justification**
Midday's AI assistant answers financial questions, surfacing insights from underlying data. This mirrors Zeke's Insight primitive, especially for AI-generated findings drawn from source materials.

**Implementation Notes**
- Implement an AI Insight Assistant that queries embeddings of source content via a tRPC endpoint (`search` or `ask`) similar to Midday's approach with OpenAI and pgvector.
- Present answers in a chat or query interface, allowing users to save AI responses as confirmed insights.
- Repurpose Midday's intelligent filtering utilities (e.g., `generate-transactions-filters.ts`, `generate-vault-filters.ts`) to help users sift through sources.

### Ingestion Workflows (Matching Engine) -> Playbooks (Automated Sequences)
**Description / Justification**
Midday's backend workflows-document matching, background jobs, Trigger.dev sequences-are orchestrated steps (upload -> OCR -> match -> notify). These map directly to Zeke's Playbooks: repeatable automation chains that operate on sources to yield outcomes.

**Implementation Notes**
- Define playbooks as configurable sequences, using background workers or serverless functions to run long-lived jobs.
- Mirror Midday's Trigger.dev integration (`tasks.trigger(...)`) alongside a realtime status hook (like `useSyncStatus`) to monitor progress in the UI.
- Combine URL-driven flows, background tasks, and realtime updates so users can launch, observe, and reuse playbooks (e.g., a "Source Ingestion Playbook" modeled after Midday's Magic Inbox).

_Notes:_ Midday features without direct analogs in Zeke (such as Time Tracking or Team Management) are out of scope here, though their patterns-project timelines, multi-tenancy-may inspire future primitives.

## Architectural Patterns & Best Practices from Midday
- **Modular tRPC router structure:** Separate routers by domain (transactions, documents, inbox, reports) with shared Zod schemas and a dedicated types package. Mirror this by creating routers for each Zeke primitive to maintain end-to-end type safety.
- **Supabase for database and storage:** Use Supabase Postgres (with Row-Level Security) and storage buckets organized by team-scoped paths, issuing signed URLs for access. The same setup suits Zeke's source files, insights, and realtime updates.
- **URL-state driven modal flows:** Manage workflows via query parameters (`?step=import`, etc.) so modals and sidebars are shareable, refresh-safe, and navigable. Implement a hook like Midday's `useQueryStates` for consistent state handling.
- **Sync status and background jobs:** Kick off background work through actions that return a `runId`, then observe job state with hooks (e.g., `useSyncStatus`) and refresh affected queries on completion to keep the UI responsive.
- **Modal & inline server actions:** Follow Midday's pattern of React server actions (wrapped with an auth-aware client) for mutations such as story creation, source uploads, and brief generation to enforce auth and type safety.
- **Supabase realtime & sync:** Subscribe to changes on critical tables (Sources, Insights, etc.) so collaborators see live updates, complementing manual cache invalidation.
- **Design system & UI components:** Reuse Midday's ShadCN/Tailwind component patterns for dialogs, list views, empty states, and layout structure to accelerate Zeke's UI build-out.

## Source Import Modal Vision & Flow
To integrate the patterns above, Zeke can adopt a Source Import Modal flow inspired by Midday's process. The flow covers adding a new Source-uploading a document or connecting an external feed-in a guided, multi-step experience:

1. **Launch import flow:** Clicking "Add Source" updates the URL (for example, `?step=import`) and opens the Import Source modal via a hook that inspects query params.
2. **Choose source type:** Present options such as Upload File, Enter URL, or Connect Account. For connected integrations, initiate OAuth inline or in a pop-up before returning to the modal.
3. **Upload & preview:** After selection, advance automatically (e.g., `?step=import&stage=mapping`). Upload files immediately to Supabase storage, show previews (document text, file metadata, or CSV column mapping), and let users adjust field mappings when applicable.
4. **Confirmation & ingestion:** On submit, call a server action (`importSourceAction`) that stores a Source record, kicks off extraction or parsing jobs, and queues any downstream playbooks (e.g., `tasks.trigger("ingest-source", { sourceId })`).
5. **Progress tracking:** Display progress indicators while the background job runs, subscribing to status updates through Supabase Realtime, Trigger.dev listeners, or polling.
6. **Completion & feedback:** Close the modal when the job reports completion, refresh relevant queries (Sources list, dashboards), and show success or error toasts to guide next steps.
7. **Post-import linking (optional):** Prompt users to link the new source to Stories or convert findings into Insights, similar to Midday's automatic receipt-to-transaction matching.

## References
- `repomix-output.txt` (local diagnostics)
- Midday GitHub: <https://github.com/midday-ai/midday>
- Midday update log: <https://midday.ai/updates/48>
