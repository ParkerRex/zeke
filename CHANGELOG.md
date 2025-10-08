# Changelog

## [Unreleased]

### Fixed

- **auth-bug**: OAuth authentication now works correctly with locale-prefixed routes
  - Root cause: Middleware matcher pattern did not account for i18n URL rewriting (`/api/auth/callback` → `/en/api/auth/callback`)
  - Impact: Authentication middleware, OAuth callback handler
  - PR: [#22](https://github.com/joinvai/zeke/pull/22)

### Fixed - 2025-09-30

**OpenAI Responses API Compatibility**

Fixed critical OpenAI API compatibility issues that were preventing the ingestion pipeline from completing. The pipeline now works end-to-end with the OpenAI Responses API and gpt-5-nano model.

**Changes:**
- Fixed `response_format` parameter structure in `generateAnalysis` - moved from root level to `text.format` nested structure per Responses API requirements (`packages/jobs/src/utils/openai/generateAnalysis.ts:58-93`)
- Removed `max_tokens` parameter from `generate-brief` task - not supported in Responses API (`packages/jobs/src/tasks/briefs/generate.ts:98`)
- Removed `temperature` parameter from `generate-brief` task - not supported by gpt-5-nano model (`packages/jobs/src/tasks/briefs/generate.ts:98`)

**Validation:**
- Complete pipeline tested successfully: ingest → fetch → analyze → brief → highlights → score
- All tasks completing in <20 seconds total
- Pipeline now compatible with gpt-5-nano and OpenAI Responses API

**Technical Details:**
The OpenAI Responses API introduced breaking changes from the Chat Completions API:
1. `response_format` parameter moved from root to `text.format`
2. `max_tokens` parameter removed entirely (automatic token management)
3. Model-specific limitations (gpt-5-nano doesn't support `temperature`)

#### Authors: 1

- Parker Rex ([@parkerrex](https://github.com/parkerrex))

---

# v1.0.0 (Sat Sep 13 2025)

### Example Item
- Example change. [#000] (https://github.com/joinvai/zeke/pull/000) ([@parkerrex](https://github.com/parkerrex))

#### Authors: 1

- Parker Rex ([@parkerrex](https://github.com/parkerrex))

---

