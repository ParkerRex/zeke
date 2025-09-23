# Engine Client Agent Instructions

## Coding Preferences

- Favor pure functions and explicit inputs/outputs; avoid hidden state unless absolutely necessary
- Keep modules single-purpose; split shared helpers into `src/lib` and document their contracts
- Prefer TypeScript interfaces over types for shared contracts, and colocate them with the implementation that owns the shape
- Use descriptive async function names (e.g., `fetchSessionConfig`) and always wrap external errors with contextual messages before rethrowing
- Maintain consistent error handling by returning `EngineResult<T>` or throwing `EngineClientError`
- Co-locate unit tests next to implementations with `.test.ts` suffix and keep mocks minimal
- When touching network code, assert request/response types via Zod schemas in `schema/` to guard against API drift
- Document non-trivial flows with a top-of-file comment block that explains the sequence and important side effects

## Project Layout

```
packages/engine-client/
├── package.json              # Package metadata, build scripts, dependency pins
├── tsconfig.json            # TypeScript config shared across the engine client
├── src/                     # Main source tree for runtime code
│   ├── index.ts            # Public entry point; re-exports the client surface area
│   ├── client/             # High-level client orchestration
│   │   ├── engine-client.ts   # Primary client class handling session lifecycle and requests
│   │   └── config.ts          # Configuration loaders, defaults, environment resolution
│   ├── adapters/           # Pluggable transport or storage adapters
│   │   ├── http-adapter.ts    # Fetch-based HTTP transport with retry/backoff logic
│   │   └── websocket.ts       # Streaming/WebSocket adapter for real-time agent updates
│   ├── schema/             # Zod schemas and validators for API contracts
│   │   └── engine.ts          # Canonical request/response schema definitions
│   ├── lib/                # Shared helpers and utilities
│   │   ├── logger.ts          # Thin wrapper around pino for consistent logging formats
│   │   ├── retry.ts           # Generic retry utilities used by adapters
│   │   └── timers.ts          # Timeout/cancellation helpers for long-running tasks
│   └── metrics/            # Instrumentation hooks exported to consuming apps
│       └── traces.ts          # OpenTelemetry trace helpers keyed to engine operations
├── tests/                  # Integration and contract tests spanning multiple modules
│   └── engine-client.test.ts # End-to-end assertions for the exported client behaviour
└── README.md               # Quick-start usage, environment setup, and troubleshooting notes
```