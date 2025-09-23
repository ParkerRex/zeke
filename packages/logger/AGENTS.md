# Coding Preferences

Keep the logger package TypeScript-first; prefer import syntax with ES module interop enabled and only fall back to require for non-typed modules.
Expose a single logger instance configured via environment-aware defaults; avoid instantiating new pino loggers elsewhere.
Guard configuration with clear names (LOG_LEVEL, NODE_ENV) and document any additional env vars directly above their usage.
Keep pretty transport settings development-only and lean on structured JSON for all non-dev environments.
When extending, add helper functions in src/ that wrap logger (e.g., for child loggers or redactors) rather than mutating global state.

# Layout Guide

```
packages/logger/
├─ package.json // Package metadata, build/test scripts, and external dependencies (pino, prettifier)
├─ tsconfig.json // Narrow TypeScript config targeting Node runtimes with commonjs interop
└─ src/
   └─ index.ts // Creates and exports the configured pino logger with env-driven level and dev pretty transport
```