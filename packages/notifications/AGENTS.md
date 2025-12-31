# Notifications Agent Preferences

## Code Preferences

- Treat NotificationHandler as the contract: every handler must validate with its Zod schema, populate createActivity metadata for the notification center, and set an explicit emailType when email is supported.
- Keep schemas in schemas.ts as the single source of truth—add new Zod objects there first, export the inferred TypeScript type, and wire it into NotificationTypes so Notifications.create stays type-safe.
- Activities should always conform to createActivitySchema; set priorities deliberately (1–10) and note when runtime options may override them.
- Localize email copy with getI18n, build customer links with getAppUrl, and route reply-to addresses via helpers (getInboxEmail) instead of hardcoding strings.
- Use the NotificationOptions bag for runtime overrides (priority, Resend options) and rely on EmailService for preference filtering; handlers shouldn't reach into the database.
- Whenever a new type is introduced, register it in handlers inside src/index.ts and describe how it surfaces in settings via allNotificationTypes (channels, category, display order).

## Navigation Guide
```
packages/notifications/                 # Event-driven notification system for the Zeke platform
├── package.json                        # Package metadata, build scripts, dependency manifest for the notifications module
├── tsconfig.json                       # TypeScript compiler settings tailored to the package's runtime and type exports
└── src/                                # Notification runtime, schemas, and handler registry
    ├── base.ts                         # Shared TypeScript interfaces plus reusable Zod schemas and helper types for handlers
    ├── index.ts                        # Main Notifications class: orchestrates validation, activity creation, email dispatch, and exports
    ├── notification-types.ts           # Declarative registry of notification surfaces and their channel/UX metadata
    ├── schemas.ts                      # Zod schemas, inferred types, and NotificationTypes map covering every supported payload
    ├── services/                       # Integrations that power delivery (email, etc.)
    │   └── email-service.ts            # Resend client wrapper that respects user preferences, renders templates, and batches sends
    └── types/                          # Per-notification handlers implementing the NotificationHandler contract
        ├── document-processed.ts       # Logs completed document processing with optional metadata about file analysis; no email
        ├── document-uploaded.ts        # Records user-triggered document uploads for inbox visibility
        ├── inbox-auto-matched.ts       # Captures auto-matched inbox items with confidence metrics
        ├── inbox-cross-currency-matched.ts # Highlights currency-mismatch matches with elevated priority
        ├── inbox-needs-review.ts       # Flags suggested matches that require human review
        ├── inbox-new.ts                # Announces new inbox items with source/provider context
        ├── invoice-cancelled.ts        # Tracks cancelled invoices and the actor responsible
        ├── invoice-created.ts          # Records freshly created invoices with amount and creator info
        ├── invoice-overdue.ts          # Alerts owners to overdue invoices and emails them with invoice details
        ├── invoice-paid.ts             # Marks invoices as paid and emails the owner group with a receipt link
        ├── invoice-reminder-sent.ts    # Logs reminder dispatches and emails customers with encrypted viewing links
        ├── invoice-scheduled.ts        # Notes scheduled send times for automated invoices
        ├── invoice-sent.ts             # Records sent invoices and emails customers using the public invoice portal
        ├── transactions-assigned.ts    # Notifies when transactions get reassigned to another teammate
        ├── transactions-categorized.ts # Captures manual category assignments for auditability
        ├── transactions-created.ts     # Summarizes new transaction imports and emails owners with the batch details
        └── transactions-exported.ts    # Logs exports with formatting metadata to confirm delivery to downstream systems
```