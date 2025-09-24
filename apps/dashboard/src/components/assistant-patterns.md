# Assistant Patterns

## Overview

The assistant lives in the dashboard shell as a global modal plus a home-screen widget. The modal is mounted in `GlobalSheets`, so it's available on every authenticated page (`apps/dashboard/src/components/sheets/global-sheets.tsx:44`). The modal simply wraps the Assistant component (`apps/dashboard/src/components/assistant/assistant-modal.tsx:7`), which renders a header and the shared Chat experience (`apps/dashboard/src/components/assistant/index.tsx:4`).

## State & Entry Points

- **UI state** is handled by a tiny Zustand store exposing `isOpen`, the optional prefilled message, and a `setOpen` toggle (`apps/dashboard/src/store/assistant.ts:9`). Calling `setOpen()` flips the modal and, when a string is passed, primes the next chat turn.

- **Several surfaces open the assistant:**
  - The dashboard widget input focuses into the modal (`apps/dashboard/src/components/widgets/assistant/assistant-input.tsx:15`)
  - The widget's suggested prompts call `setOpen(example)` to autoboot a message (`apps/dashboard/src/components/widgets/assistant/assistant-list.tsx:18`)
  - The chat header close button toggles the store (`apps/dashboard/src/components/assistant/header.tsx:18`)
  - Tool outputs can also bounce users into the full transactions page while closing the modal (`apps/dashboard/src/components/chat/tools/transactions/show-more-buttont.tsx:16`)

## Conversation Pipeline

- **Chat** relies on the Vercel AI SDK's `useChat` hook to manage messages, input state, and streaming status (`apps/dashboard/src/components/chat/index.tsx:16`). The hook posts to `/api/chat`, throttles token updates, and exposes helpers like `append` and `handleSubmit`.

- When the store's message field changes, a side effect injects that text as a user turn and immediately submits it (`apps/dashboard/src/components/chat/index.tsx:30`).

- Messages are rendered with automatic scroll management and a "thinking" placeholder while the model is processing (`apps/dashboard/src/components/chat/messages.tsx:14`). Markdown responses are supported (`apps/dashboard/src/components/chat/message.tsx:66`), and avatars switch between the user and the Midday logo (`apps/dashboard/src/components/chat/chat-avatar.tsx:15`).

## Server Execution & Tooling

- The `/api/chat` route streams responses from `streamText` with the OpenAI `gpt-4.1-mini` model (`apps/dashboard/src/app/api/chat/route.ts:19`). The system prompt guides financial reasoning, while `maxSteps` limits tool-call loops and `smoothStream` turns the output into word-sized SSE chunks (`apps/dashboard/src/app/api/chat/route.ts:33` and `apps/dashboard/src/app/api/chat/route.ts:37`).

- **Tools** are declared with the AI SDK's `tool` helper and imported into the route (`apps/dashboard/src/app/api/chat/route.ts:38`). Each tool uses the server-side TRPC client (`getQueryClient`) to hit Midday APIs with the current user session baked into headers (`apps/dashboard/src/lib/tools/get-transactions.ts:93`, `apps/dashboard/src/trpc/server.tsx:9`).

- **Parameter schemas** live alongside the tool implementation via Zod, giving the model structured affordances (e.g. rich filtering on transactions in `apps/dashboard/src/lib/tools/get-transactions.ts:13`, finance metrics in `apps/dashboard/src/lib/tools/get-burn-rate.ts:9` and `apps/dashboard/src/lib/tools/get-tax-summary.ts:10`).

- **Tool results** can be plain strings (letting the model narrate) or structured payloads. For example:
  - `getTaxSummary` returns summarized and per-category data (`apps/dashboard/src/lib/tools/get-tax-summary.ts:53`)
  - `getBurnRate` includes the parameters needed to rehydrate charts on the client (`apps/dashboard/src/lib/tools/get-burn-rate.ts:45`)

## Rendering Tool Output

- Incoming tool invocations are parsed from the streamed message parts. The `ToolResult` switch swaps in dedicated UI components for each supported renderer (`apps/dashboard/src/components/chat/message.tsx:27`). Anything without a custom renderer falls back to the language model's prose.

- **Client renderers** refetch authoritative data with React Query so the UI stays in sync with the live backend:
  - The burn-rate chart reuses the TRPC query keyed by the tool's parameters (`apps/dashboard/src/components/chat/tools/burn-rate/burn-rate.tsx:15`)
  - Document search hydrates a preview carousel (`apps/dashboard/src/components/chat/tools/documents/documents.tsx:12`)
  - Transactions render as a table with status chips plus "show more" navigation (`apps/dashboard/src/components/chat/tools/transactions/transactions.tsx:22`)

## State Summary

- **Modal visibility & priming:** `useAssistantStore`
- **Conversation state & streaming:** `useChat` (local to the component instance)
- **Data caches for tool views:** React Query + TRPC (`apps/dashboard/src/components/chat/tools/burn-rate/burn-rate.tsx:12`)
- **Persistent placement:** `AssistantModal` mounted once in the dashboard shell

## Working With the Assistant

### Adding New Tools

1. **Create a tool** by creating a new file under `apps/dashboard/src/lib/tools`, exporting a `tool({...})`, and importing it into the `/api/chat` route list. Provide clear Zod schemas; return any parameters the UI might need.

2. **Add custom visuals** (if needed) by creating a renderer under `apps/dashboard/src/components/chat/tools/<name>` and adding a case in `ToolResult`.

3. **Reuse TRPC query options** in both the tool (server) and renderer (client) to avoid duplicating fetch logic; the query key parameters should match exactly to benefit from hydration.

4. **Keep in mind the `useAssistantStore` toggle:** calling `setOpen` without arguments just flips the modal, so pass `undefined` when you don't want to autoplay a message.

## Next Steps

Consider these actions to better understand the assistant:

1. **Exercise the flow** by running the dashboard, triggering a few sample prompts, and watching tool invocations in the browser network panel (look at the SSE stream).

2. **Decide on visualizations** - whether any of the string-returning tools need richer visualizations, then follow the renderer pattern above.