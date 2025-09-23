# Categories Package

## Code Preferences

- TypeScript-first: prefer literal types and Zod schemas from src/types.ts to guarantee category and tax structures stay in sync; extend schemas before widening TypeScript interfaces.
- Deterministic data: keep category definitions pure and data-driven in src/categories.ts; avoid runtime mutations outside helper functions like applyColorsToCategories.
- Color handling: reuse getCategoryColor / CATEGORY_COLOR_MAP instead of hard-coding hex values; add new palette entries centrally in src/color-system.ts.
- Tax logic: add country configs in src/tax-rates/index.ts with succinct VAT/GST notes; keep defaults conservative and document deviations inline.
- Utilities: prefer composing helpers from src/utils.ts rather than reimplementing flattening, lookup, or tax enrichment logic elsewhere.
- Embeddings: treat src/embeddings.ts as the single integration point with Gemini—wrap new vector use-cases behind class methods, and gate calls on the GOOGLE_GENERATIVE_AI_API_KEY env var.

## Layout Overview

```
packages/categories/
├─ README.md              # High-level package usage and integration notes.
├─ package.json           # Package metadata, build scripts, dependency pins.
├─ tsconfig.json          # TS compiler settings shared across the package.
└─ src/
   ├─ index.ts            # Barrel file exporting public types, constants, and helpers.
   ├─ categories.ts       # Canonical category hierarchy plus color enrichment logic.
   ├─ color-system.ts     # Deterministic palette, hash utilities, and color lookups.
   ├─ embeddings.ts       # Gemini embedding helpers and thin service wrapper.
   ├─ tax-rates/
   │  └─ index.ts         # Country-specific tax rate registry and accessors.
   ├─ types.ts            # TS interfaces and Zod schemas for categories and tax configs.
   └─ utils.ts            # Lookup/flattening helpers and tax-aware category accessor.
```