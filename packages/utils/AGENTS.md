## Writing Preferences

- Keep utilities pure and stateless; pass all inputs explicitly and avoid hidden I/O unless the helper is environment-specific (e.g. envs.ts).
- Use TypeScript's literal types and Record helper for constant maps; add narrow function signatures so callers get autocomplete and validation.
- Prefer small, domain-focused modules; colocate related helpers and only re‑export the public API via src/index.ts.
- Guard against bad inputs early (nullish checks, normalization) and return sensible defaults rather than throwing where possible.
- Document non-trivial behaviour with short comments above the block; inline comments should explain "why", not "what".
- Stick to the existing formatting conventions (two-space indents, double quotes, trailing commas) and rely on Biome/TS compiler to enforce style.
- When adding a new helper, accompany it with minimal Jest/Vitest coverage or usage examples in the consumer package, depending on where assertions fit best.


## Layout Guide
```
packages/utils/                      # Shared utility functions for the Midday ecosystem
├── package.json                     # Package metadata plus build targets used by dependents
├── tsconfig.json                    # TypeScript settings tuned for isolated utility builds
└── src/                             # Source code for utility functions
    ├── index.ts                     # Entry point; exposes the public surface and shared helpers
    ├── format.ts                    # Currency/number formatting utilities wrapping Intl APIs
    ├── mime-to-extension.ts         # MIME type helpers for resolving safe file extensions
    ├── envs.ts                      # URL resolvers that derive app/email/site origins by env
    └── tax.ts                       # Static tax definitions and country-level lookup helpers
```