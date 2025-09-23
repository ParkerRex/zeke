Coding Preferences

- Keep the CSV ingestion path pure: map raw rows via mapTransactions, normalize with transform, then validate; avoid inlining these steps elsewhere.
- Declare shared shapes in types.ts and extend them instead of introducing anonymous object literals for transactions.
- Normalize money/date strings exclusively through formatAmountValue and formatDate; pass inverted explicitly rather than double-negating amounts downstream.
- When adding mappings, treat mappings keys as the destination field names; strip empty map entries before projecting rows to avoid polluted payloads.
- Surface new output fields by decorating the object returned from transform instead of patching post-transform; always uppercase currency and reuse uuidv4 for internal IDs.
- Gate schema changes through createTransactionSchema in validate.ts; prefer tightening the Zod contract over sprinkling ad-hoc guards.
- Add regression coverage beside helpers in utils.test.ts; use Bun's describe/it style already in place.

Project Layout

```
packages/import/
├── package.json          # Package metadata, shared scripts, and export map for public helpers
├── tsconfig.json         # Extends the base TypeScript config and scopes compilation to src/
└── src/
    ├── index.ts          # Barrel re-export exposing utility surface to consumers
    ├── mappings.ts       # Projects CSV row data into typed Transactions using column mappings
    ├── transform.ts      # Builds the normalized transaction payload destined for downstream APIs
    ├── types.ts          # Transaction type definitions shared across mapping/transform/validation
    ├── utils.ts          # String parsers and formatters for dates and monetary amounts
    ├── utils.test.ts     # Bun unit tests covering the date and amount normalization helpers
    └── validate.ts       # Zod schema and validator that split valid vs invalid transaction payloads
```