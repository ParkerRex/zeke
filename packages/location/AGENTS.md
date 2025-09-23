Code Style

- Keep data sources as JSON with matching .ts re-exports for type safety and tree-shakability; avoid mixing large literals into logic files.
- When reading request metadata (headers, geo info), centralize in async helpers, defaulting to sane fallbacks just like getCountryCode and friends.
- Prefer small, pure helpers that return plain objects/strings; avoid side effects and ensure all exports remain server-friendly (no direct DOM usage).
- Use exhaustive country/currency/timezone coverage by key; when adding entries, mirror the comment format already used in currencies.ts.
- Document any heuristics (date formats, EU membership) inline so future adjustments are easy to reason about.

Layout Guide

```
packages/location/
├── package.json          # Package metadata and bundling entry points for the location utilities.
├── tsconfig.json         # TypeScript settings, aligns module resolution with the monorepo baseline.
└── src/
    ├── countries.json        # Canonical country list (base locale).
    ├── countries.ts          # Re-exports `countries.json` for typed imports.
    ├── countries-intl.json   # Internationalized country names dataset.
    ├── countries-intl.ts     # Re-exports `countries-intl.json` for consumers needing i18n data.
    ├── country-flags.ts      # Map of ISO country codes to flag metadata (emoji, unicode, names).
    ├── currencies.ts         # Country-code to currency-code mapping with inline docs.
    ├── eu-countries.ts       # Array of ISO country codes considered part of the EU/EEA grouping.
    ├── index.ts              # Public API: header-derived locale helpers, timezone/currency/date utilities.
    ├── timezones.json        # Canonical timezone dataset consumed by helpers.
    └── timezones.ts          # Thin wrapper exporting the timezone collection.
```