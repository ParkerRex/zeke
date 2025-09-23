# Invoice Package Agent Instructions

## Coding Preferences

- **Lean on shared domain types** from `packages/invoice/src/types.ts` so HTML, PDF, and OG templates stay in sync and consumers get exhaustiveness checking
- **Keep rendering components presentational**: accept fully shaped props, guard optional fields, and let shared helpers (e.g. `calculateTotal`, `formatEditorContent`) handle data massaging
- **Reuse existing formatters** (`formatAmount`, `formatCurrencyForPDF`) instead of hand-building currency strings; always respect locale- and template-driven settings
- **Utilities should remain pure and defensive**—mirror the null/undefined protections already in `calculate.ts` and `transform.ts`, and cover meaningful logic with Bun tests beside the implementation
- **When touching async code** (e.g. token helpers, logo validation) prefer async/await, surface errors explicitly, and keep environment access contained to the boundary modules
- **Styling lives in templates**; follow their tailwind-like conventions for HTML/OG and react-pdf style objects for PDF, adding comments only around non-obvious layout workarounds

## Project Structure

```
packages/invoice
├── package.json — package manifest with build scripts and dependencies for invoice rendering
├── tsconfig.json — TypeScript compiler options scoped to this package
└── src
    ├── index.tsx — public entry point re-exporting templates, editor stub, and logo utilities plus react-pdf helpers
    ├── types.ts — canonical Invoice, Template, and rich-text node definitions shared across render targets
    ├── editor
    │   └── index.tsx — placeholder Editor component to satisfy downstream imports without bundling UI
    ├── token
    │   └── index.ts — jose-powered JWT helpers for generating and verifying invoice access tokens
    ├── templates
    │   ├── html
    │   │   ├── index.tsx — dashboard HTML preview composed with ScrollArea and template fragments
    │   │   ├── format.tsx — converts tiptap-like EditorDoc nodes into React elements with styling marks
    │   │   └── components
    │   │       ├── description.tsx — normalizes stored JSON blocks or raw text into renderable descriptions
    │   │       ├── editor-content.tsx — lightweight wrapper that renders formatted EditorDoc content in HTML
    │   │       ├── line-items.tsx — grid layout for invoice line items with currency/unit formatting
    │   │       ├── logo.tsx — constrained logo image renderer respecting customer name for alt text
    │   │       ├── meta.tsx — header block for number, issue, and due dates with timezone-aware formatting
    │   │       └── summary.tsx — subtotal/discount/tax footer mirroring business rules in calculate utilities
    │   ├── og
    │   │   ├── index.tsx — Open Graph image layout for invoices using twin.macro styling
    │   │   ├── format.tsx — OG-specific rendering of EditorDoc content with enlarged typography
    │   │   └── components
    │   │       ├── avatar.tsx — falls back to customer initial when no valid logo is available
    │   │       ├── editor-content.tsx — renders rich text blocks within OG image constraints
    │   │       ├── header.tsx — top row combining avatar and status pill
    │   │       ├── logo.tsx — optional large-format logo display
    │   │       ├── meta.tsx — invoice number and dates formatted for OG output
    │   │       └── status.tsx — status badge with palette tied to invoice state
    │   └── pdf
    │       ├── index.tsx — main react-pdf document generator configuring fonts, QR code, and layout
    │       ├── format.tsx — PDF-specific translation of EditorDoc nodes into Text/Link elements
    │       └── components
    │           ├── description.tsx — parses description content for PDF rows, falling back to plain text
    │           ├── editor-content.tsx — injects formatted EditorDoc blocks into PDF views
    │           ├── line-items.tsx — PDF table for line items with currency formatting and unit support
    │           ├── meta.tsx — PDF invoice header with localized date formatting
    │           ├── note.tsx — renders optional note section within the PDF
    │           ├── payment-details.tsx — outputs payment instructions block for PDF
    │           ├── qr-code.tsx — embeds generated QR code images when templates request them
    │           └── summary.tsx — totals section combining discounts, tax, VAT, and grand total for PDF
    └── utils
        ├── calculate.ts — pure helpers for subtotal, tax/VAT, and per-line totals with defensive defaults
        ├── calculate.test.ts — Bun test coverage for calculation utilities and edge cases
        ├── content.ts — tiny guard to detect JSON-serialized editor blocks before parsing
        ├── logo.ts — async validator that checks remote logo URLs via fetch
        ├── pdf-format.ts — workaround to preserve minus signs when formatting currency in react-pdf
        └── transform.ts — transforms customer records into EditorDoc structures for templating
```

## Key Architecture Decisions

### Type Safety
All templates (HTML, PDF, OG) share the same type definitions from `types.ts` to ensure consistency across render targets and provide exhaustiveness checking for consumers.

### Component Philosophy
- Rendering components are kept purely presentational
- They accept fully-formed props and delegate data processing to shared utilities
- Optional field guards are built into components for defensive programming

### Utilities
- All utility functions are pure and defensive
- Null/undefined checks are standard practice
- Critical business logic is covered by Bun tests co-located with implementations

### Template Organization
Each render target (HTML, PDF, OG) has its own template directory with:
- Target-specific `index.tsx` entry point
- Format converter for EditorDoc content
- Components folder with specialized renderers

### Testing Strategy
Tests are written using Bun and placed alongside implementations (e.g., `calculate.test.ts` next to `calculate.ts`)