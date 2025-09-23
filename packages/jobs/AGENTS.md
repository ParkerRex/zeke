# Jobs Package Agent Instructions

## Coding Preferences

- **Define every new job payload with Zod** in `src/schema.ts`, then bind it via `schemaTask`/`batchTask` so runtime validation stays centralized
- **Reach for `getDb()`** from `src/init.ts` when touching Postgres and use the provided Supabase client helpers; avoid ad-hoc connection setup inside tasks
- **Capture job logging** through `@trigger.dev/sdk`'s logger and keep structured metadata consistent for easier tracing in Trigger
- **Share reusable routines** by extending the helpers in `src/utils/` (e.g., `processBatch`, `triggerBatch`, `text-preparation`) instead of re-implementing batching or transformation logic inside tasks
- **Keep domain behavior inside its task folder** (`bank/`, `inbox/`, `invoice/`, etc.) and call cross-cutting utilities or connectors (`@midday/inbox`, `@midday/notifications`) rather than duplicating API access
- **When introducing schedulers**, mirror the existing pattern: configure via `schedules.task`, generate cron strings with `generateCronTag`, and guard re-registration through deduplication keys
- **Co-locate new low-level helpers** with accompanying Bun or Trigger-facing tests (see `src/utils/transform.test.ts`) to preserve coverage close to the implementation

## Project Structure

```
packages/jobs/
├── package.json                        # Trigger.dev job package metadata, deps, and scripts
├── tsconfig.json                       # TypeScript config with @jobs/* path alias and React JSX support
├── trigger.config.ts                   # Global Trigger.dev runtime settings, retry strategy, and task directories
├── scripts/                            # CLI utilities for managing bank schedulers
│   ├── delete-bank-schedulers.ts       # Tears down existing bank sync schedules in Trigger
│   ├── get-eligible-teams.ts           # Queries Supabase for teams that qualify for automated bank syncs
│   ├── list-bank-schedulers.ts         # Prints the currently registered bank scheduler jobs
│   └── register-bank-schedulers.ts     # Interactive bulk registration flow for bank sync schedulers
└── src/
    ├── init.ts                         # Trigger middleware that provisions per-run DB clients and handles wait/resume lifecycles
    ├── schema.ts                       # Central Zod definitions + TypeScript payloads for every job/scheduler
    ├── tasks/                          # Trigger tasks grouped by domain vertical
    │   ├── bank/                       # Banking connection lifecycle, syncing, and notifications
    │   │   ├── delete/
    │   │   │   └── delete-connection.ts         # Cleans up external bank connections and tokens when removed
    │   │   ├── notifications/
    │   │   │   └── transactions.ts              # Sends transaction-related notifications after bank syncs
    │   │   ├── scheduler/
    │   │   │   └── bank-scheduler.ts            # Recurring bank sync scheduler definition
    │   │   ├── setup/
    │   │   │   └── initial.ts                   # First-run setup pipeline for new bank connections
    │   │   ├── sync/
    │   │   │   ├── account.ts                   # Pulls account-level data from providers and persists updates
    │   │   │   └── connection.ts                # Orchestrates full connection syncs across accounts
    │   │   └── transactions/
    │   │       └── upsert.ts                    # Upserts provider transactions into Supabase and triggers follow-up flows
    │   ├── document/                   # Document ingestion, classification, and enrichment jobs
    │   │   ├── classify-document.ts             # Uses AI to categorize uploaded documents
    │   │   ├── classify-image.ts                # Image-specific classification pipeline
    │   │   ├── convert-heic.ts                  # HEIC-to-standard image conversion helper
    │   │   ├── embed-document-tags.ts           # Generates embeddings and metadata tags for documents
    │   │   └── process-document.ts              # Main document processing flow (storage, OCR, tagging)
    │   ├── inbox/                      # Shared inbox ingestion, matching, and Slack integrations
    │   │   ├── batch-process-matching.ts        # Batch job that processes queued inbox matching tasks
    │   │   ├── embed-inbox.ts                   # Generates embeddings for inbox content
    │   │   ├── match-transactions-bidirectional.ts # Links inbox documents to transactions in both directions
    │   │   ├── no-match-scheduler.ts            # Scheduler that surfaces unmatched inbox items for review
    │   │   ├── process-attachment.ts            # Handles uploaded attachments from providers into storage + follow-ups
    │   │   ├── slack-upload.ts                  # Pushes inbox files into Slack threads/channels
    │   │   └── provider/                        # Provider-specific sync orchestration
    │   │       ├── initial-setup.ts             # One-time configuration for new inbox provider accounts
    │   │       ├── sheduler.ts                  # Recurring sync scheduler (externalId keyed per inbox account)
    │   │       └── sync-account.ts              # Fetches provider attachments, stores them, and queues processing
    │   ├── invoice/                    # Automated invoice generation, scheduling, and notifications
    │   │   ├── email/
    │   │   │   ├── send-email.ts                # Composes and sends invoice emails via configured provider
    │   │   │   └── send-reminder.ts             # Reminder email job for overdue invoices
    │   │   ├── notifications/
    │   │   │   └── send-notifications.ts        # Dispatches invoice status notifications across channels
    │   │   ├── operations/
    │   │   │   ├── check-status.ts              # Polls invoice status and updates state
    │   │   │   ├── generate-invoice.ts          # Renders invoice PDFs, uploads to storage, and triggers indexing
    │   │   │   └── schedule-invoice.ts          # Schedules future invoice sends based on configuration
    │   │   └── scheduler/
    │   │       └── invoice-scheduler.ts         # Cron-backed scheduler that kicks off invoice workflows
    │   ├── notifications/
    │   │   └── notifications.ts                 # General notification dispatcher task used across domains
    │   ├── rates/
    │   │   └── rates-scheduler.ts               # Periodic foreign-exchange or rate update job
    │   ├── reconnect/
    │   │   └── connection.ts                    # Handles reconnect flows for lapsed provider connections
    │   ├── team/                       # Team onboarding, invites, and teardown jobs
    │   │   ├── delete.ts                        # Cleans up team data and connections during deletion
    │   │   ├── invite.ts                        # Sends team invite emails and records audit data
    │   │   └── onboarding.ts                    # Runs new-team onboarding routines and defaults
    │   └── transactions/                # Transaction enrichment, export, and attachment jobs
    │       ├── embed-transaction.ts             # Generates embeddings for selected transactions
    │       ├── enrich-transaction.ts            # Calls enrichment pipeline to augment transaction data
    │       ├── export.ts                        # Entry point for exporting transactions to files
    │       ├── import.ts                        # Kicks off transaction CSV import flow
    │       ├── process-attachment.ts            # Associates uploaded attachments with transactions
    │       ├── process-export.ts                # Post-processes generated exports (packaging, delivery)
    │       ├── update-account-base-currency.ts  # Syncs account base currency settings after changes
    │       └── update-base-currency.ts          # Adjusts team base currency and cascades downstream effects
    └── utils/                          # Shared helper utilities for tasks
        ├── base-currency.ts                     # Helpers for base-currency recalculation and validation
        ├── blob.ts                              # Blob <-> serializable array conversion utilities
        ├── check-team-plan.ts                   # Determines eligibility and plan constraints for teams
        ├── embeddings.ts                        # AI embedding helper functions used by inbox/document flows
        ├── enrichment-helpers.ts                # Shared enrichment logic (parsing, extraction) for documents
        ├── enrichment-schema.ts                 # Zod schemas backing enrichment payloads and responses
        ├── generate-cron-tag.ts                 # Builds deterministic cron expressions from team IDs
        ├── inbox-matching-notifications.ts      # Sends notifications when inbox matching results change
        ├── parse-error.ts                       # Normalizes errors into structured objects for logging/retries
        ├── process-batch.ts                     # Serial batch processor with configurable window size
        ├── resend.ts                            # Preconfigured Resend API client instance
        ├── smart-matching.ts                    # Smart matching heuristics between inbox items and transactions
        ├── text-preparation.ts                  # Cleans and tokenizes text ahead of AI/embedding work
        ├── transaction-notifications.tsx        # Slack notification sender for transaction events
        ├── transform.ts                         # Transforms Supabase transaction rows into notification payloads
        ├── transform.test.ts                    # Bun tests covering the transaction transform helpers
        ├── trigger-batch.ts                     # Helper to batch-trigger Trigger.dev tasks in chunks
        ├── trigger-sequence.ts                  # Sequential trigger runner for dependent job chains
        └── update-invocie.ts                    # Updates invoice status and dispatches follow-up notifications
```

## Key Architecture Decisions

### Schema-Driven Validation
All job payloads are defined as Zod schemas in `src/schema.ts`, providing:
- Type-safe contracts between job triggers and handlers
- Runtime validation at job boundaries
- Centralized payload definitions for consistency

### Database Access Pattern
Database connections are managed through `src/init.ts`:
- Use `getDb()` for Postgres access
- Leverage provided Supabase client helpers
- Avoid creating ad-hoc connections within tasks

### Domain Organization
Tasks are organized by business domain:
- Each domain (bank, inbox, invoice, etc.) owns its folder
- Cross-cutting concerns use shared utilities
- External packages (`@midday/inbox`, `@midday/notifications`) for common functionality

### Scheduler Patterns
Consistent approach for scheduled jobs:
1. Define schedule via `schedules.task` configuration
2. Generate cron expressions using `generateCronTag` for determinism
3. Use deduplication keys to prevent duplicate registrations
4. External IDs track per-entity schedules (e.g., per inbox account)

### Batch Processing
The package provides standard batch processing utilities:
- `processBatch` - Serial processing with configurable windows
- `triggerBatch` - Chunked Trigger.dev task invocation
- `triggerSequence` - Sequential execution for dependent jobs

### Testing Strategy
- Unit tests use Bun and are co-located with implementations
- Focus on utility functions and transformation logic
- Integration testing happens through Trigger.dev's testing infrastructure

## Adding New Jobs

When creating a new job:

1. **Define the payload schema** in `src/schema.ts`
   ```typescript
   export const NewJobPayload = z.object({
     id: z.string(),
     // ... other fields
   });
   ```

2. **Create the task file** in the appropriate domain folder
   ```typescript
   import { schemaTask } from "@trigger.dev/sdk/v3";
   import { NewJobPayload } from "@jobs/schema";
   
   export const newJob = schemaTask({
     id: "new-job",
     schema: NewJobPayload,
     run: async (payload, { ctx }) => {
       const db = await getDb(ctx);
       // ... job logic
     }
   });
   ```

3. **Use shared utilities** instead of reimplementing common patterns
4. **Add logging** with structured metadata for observability
5. **Write tests** for any new utility functions

## Common Patterns

### Error Handling
```typescript
import { parseError } from "@jobs/utils/parse-error";

try {
  // job logic
} catch (error) {
  const parsed = parseError(error);
  logger.error("Job failed", { error: parsed, payload });
  throw error; // Let Trigger.dev handle retries
}
```

### Batch Processing
```typescript
import { processBatch } from "@jobs/utils/process-batch";

await processBatch({
  items,
  batchSize: 10,
  processor: async (batch) => {
    // Process batch
  }
});
```

### Triggering Follow-up Jobs
```typescript
import { triggerBatch } from "@jobs/utils/trigger-batch";

await triggerBatch({
  trigger: followUpJob,
  payloads: items.map(item => ({ id: item.id })),
  batchSize: 25
});