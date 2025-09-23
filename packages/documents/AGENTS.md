# Documents Package

## Coding Preferences

- Keep document ingestion and routing inside DocumentClient; introduce new processors by wiring them through mime-type detection rather than branching elsewhere.
- Normalize all model outputs with the Zod schemas in schema.ts before transforming into GetInvoiceOrReceiptResponse so downstream callers receive predictable shapes.
- Wrap every networked or LLM call with retryCall (or an equivalent) and keep AbortSignal.timeout guards in place to prevent runaway requests.
- Centralize prompt authorship in prompt.ts; version prompts alongside schema changes and avoid inline strings in processors or classifiers.
- Extend loadDocument when adding new mime types, and remember to update isMimeTypeSupportedForProcessing plus unit tests so allowed formats stay in sync.
- Filter inbound attachments through getAllowedAttachments / allowedMimeTypes; never trust upstream payloads without checking size and type.
- Preserve reusable helpers (utils.ts, utils/retry.ts) as pure, side-effect free utilities; keep per-processor logic inside processors/*.
- Run bun test src when touching shared helpers and prefer colocated *.test.ts files for regression coverage.
- Treat external credentials (MISTRAL_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY) as mandatory runtime preconditions; surface descriptive errors when absent.

## Layout Reference

```
packages/documents/
├── package.json                         # Workspace manifest, scripts, and export map for the documents SDK.
├── tsconfig.json                        # TypeScript compiler settings scoped to the package.
└── src/                                 # Document processing source tree.
    ├── index.ts                         # Barrel that re-exports the public client and utilities.
    ├── client.ts                        # DocumentClient orchestrating invoice vs receipt processors.
    ├── interface.ts                     # Processor interface contract used by higher-level callers.
    ├── types.ts                         # Shared request/response and attachment type definitions.
    ├── prompt.ts                        # Centralized system/user prompts for invoices, receipts, and classifiers.
    ├── schema.ts                        # Zod schemas validating model output for invoices, receipts, and classifiers.
    ├── utils.ts                         # Mime helpers, text cleaners, and content sampling utilities.
    ├── utils.test.ts                    # Bun tests covering utility helpers and attachment filtering.
    ├── embed/                           # Gemini embedding adaptor.
    │   └── embed.ts                     # Wrapper exposing single and batch embedding helpers.
    ├── classifier/                      # Document/image classification entrypoints.
    │   └── classifier.ts                # Mistral-powered classifier returning summaries, dates, and tags.
    ├── loaders/                         # File ingestion and OCR pipeline.
    │   └── loader.ts                    # Mime-aware loader that extracts text via parsers, OCR, or LangChain loaders.
    ├── processors/                      # Specialized handlers for structured document extraction.
    │   ├── invoice/                     # Invoice-specific processing logic.
    │   │   └── invoice-processor.ts     # Invoice extractor with fallback OCR merge and response shaping.
    │   └── receipt/                     # Receipt-specific processing logic.
    │       └── receipt-processor.ts     # Receipt extractor that normalizes metadata and store details.
    └── utils/                           # Secondary utility namespace.
        └── retry.ts                     # Exponential backoff helper for retryable async operations.
```