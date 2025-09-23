# Inbox Package Agent Instructions

## Coding Preferences

- **Keep the domain surface tiny**: expose only schema + utils via the barrel so downstream imports stay stable
- **When adding providers**, conform to the `OAuthProviderInterface`; wire credentials through the constructor, set tokens once, and let the provider own background token persistence
- **Centralize token handling** in `InboxConnector`; prefer augmenting the retry path there instead of sprinkling refresh logic into providers
- **Treat Gmail (and future providers) as incremental fetchers**: enforce attachment caps, scope MIME types narrowly, and log + continue when a message fetch fails
- **Normalize IDs and filenames** via the shared helpers (`generateDeterministicId`, `ensureFileExtension`, `decodeBase64Url`) instead of re-implementing conversions per provider
- **Extend validation rules only through** `schema.ts`; lean on Zod error messages to keep webhook responses self-documenting
- **Add regression coverage** beside helpers in `utils.test.ts`; mirror existing Bun tests when exercising new utility branches

## Project Structure

```
packages/inbox/
├── package.json          # Package metadata, scripts, and export map for public helpers
├── tsconfig.json         # Extends the shared TypeScript base and scopes compilation to src/
└── src/
    ├── index.ts          # Barrel exporting schema validation and utility helpers
    ├── schema.ts         # Zod contracts describing inbound inbox webhook payloads and attachments
    ├── utils.ts          # Inbox address helpers and auth error classifier reused across connector logic
    ├── utils.test.ts     # Bun tests covering the utility helpers' behavior
    ├── attachments.ts    # Base64URL → Buffer decoder used by provider attachment processing
    ├── generate-id.ts    # SHA-256 deterministic ID generator for attachment reference IDs
    ├── connector.ts      # High-level inbox connector orchestrating account persistence, token refresh, and attachment fetching
    └── providers/
        ├── gmail.ts      # Gmail OAuth implementation managing token lifecycle and PDF attachment retrieval
        └── types.ts      # Shared provider contracts (tokens, attachments, connector base class)
```

## Key Architecture Decisions

### Minimal Public API
The package maintains a minimal public interface through its barrel export (`index.ts`), exposing only schemas and utilities. This ensures downstream consumers have stable imports even as internal implementations evolve.

### Provider Architecture
All email providers must:
- Implement the `OAuthProviderInterface` contract
- Accept credentials via constructor injection
- Manage their own token persistence
- Handle incremental message fetching with proper error boundaries

### Token Management Strategy
Token refresh and retry logic is centralized in the `InboxConnector` class rather than distributed across providers. This creates a single point of control for authentication flows and reduces code duplication.

### Attachment Processing
The package enforces strict constraints on attachments:
- Size caps to prevent memory issues
- MIME type filtering for security
- Deterministic ID generation for deduplication
- Graceful failure handling (log and continue)

### Validation Philosophy
All external data validation happens through Zod schemas defined in `schema.ts`. The schemas provide:
- Type-safe contracts for webhook payloads
- Self-documenting error messages
- Runtime validation at system boundaries

### Testing Approach
- Unit tests are co-located with implementations
- Tests use Bun test runner for consistency
- Focus on regression prevention for utility functions
- New utility branches require corresponding test coverage

## Adding New Providers

When implementing a new email provider:

1. Create a new file in `src/providers/` (e.g., `outlook.ts`)
2. Implement the `OAuthProviderInterface` from `providers/types.ts`
3. Use existing helpers for ID generation and attachment processing
4. Add provider-specific token persistence if needed
5. Let the `InboxConnector` handle retry logic and token refresh orchestration
6. Test the provider integration with real API responses where possible

## Common Patterns

### Error Handling
```typescript
// Prefer logging and continuing over throwing
try {
  const attachment = await fetchAttachment(id);
  return attachment;
} catch (error) {
  logger.error('Failed to fetch attachment', { id, error });
  return null; // Continue processing other attachments
}
```

### ID Generation
```typescript
// Always use the shared helper for consistent IDs
import { generateDeterministicId } from './generate-id';
const attachmentId = generateDeterministicId(messageId, filename);
```

### Schema Extension
```typescript
// Add new fields only in schema.ts
export const InboxWebhookSchema = z.object({
  // existing fields...
  newField: z.string().optional(), // New validation rule
});