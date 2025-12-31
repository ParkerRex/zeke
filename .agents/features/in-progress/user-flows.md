# User Flows

_This document enumerates the core Zeke dashboard user flows. Each flow lists the user-facing steps alongside the key files, components, data inputs/outputs, and state transitions that enable them._

## 1. First-Time User Onboarding
1. **Locale-aware request gatekeeping** – `apps/dashboard/src/middleware.ts` removes the locale prefix, caches the intended deep link as `return_to`, and redirects unauthenticated visitors to `/login` unless the path matches public resources (`/i/`, `/s/`, `/verify`, `/all-done`, `/desktop/search`); Better Auth session reads and cookie writes happen here.
2. **Sign-in surface renders providers** – `apps/dashboard/src/app/[locale]/(public)/login/page.tsx` chooses the primary button (Google, Apple, GitHub, OTP) using `Cookies.PreferredSignInProvider`, device vendor, and EU geo checks via `isEU()`; supporting components include `GoogleSignIn`, `AppleSignIn`, `GithubSignIn`, `OTPSignIn`, and the optional `ConsentBanner`.
3. **OAuth/OTP completion exchanges a session** – `apps/dashboard/src/app/api/auth/callback/route.ts` handles the OAuth callback and stores the chosen provider cookie; desktop clients are bounced to `/verify?code=…`, while invite-based `return_to` targets get normalized to `/teams`.
4. **Desktop deep link bridge** – `/verify` (`apps/dashboard/src/app/[locale]/(public)/verify/page.tsx`) mounts `DesktopSignInVerifyCode`, which replaces `window.location` with `zeke://api/auth/callback` and exposes a manual retry link; state guarded by `hasRunned` ref to prevent loops.
5. **Mandatory MFA enrollment** – lacking the `Cookies.MfaSetupVisited` flag from the callback route pushes first-time devices to `/mfa/setup`, where `SetupMfa` + `EnrollMFA` guide the QR scan, TOTP verification, Better Auth MFA enrollment, and optional unenroll-on-cancel.
6. **Authenticated route guard** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx` fetches `trpc.user.me`; missing `fullName` triggers `redirect("/setup")`, missing `teamId` triggers `redirect("/teams")`, ensuring downstream layout always has identity & context.
7. **Profile completion form** – `/setup` (`apps/dashboard/src/app/[locale]/(app)/setup/page.tsx`) wraps `SetupForm`, which updates `user.fullName` through `useUserMutation`, invalidates the React Query cache, and pushes the router to `/teams` on success; avatar uploads are optional via `AvatarUpload`.
8. **Team selection & invite triage** – `/teams` (`apps/dashboard/src/app/[locale]/(app)/teams/page.tsx`) prefetches `trpc.team.list`, `trpc.team.invitesByEmail`, and `trpc.user.me`; `SelectTeamTable` rows invoke `trpc.user.update` to swap `teamId`, while `TeamInvites` offers accept/decline mutations. Lack of data triggers `redirect("/teams/create")`.
9. **Team creation workflow** – `/teams/create` hosts `CreateTeamForm`, which `use`s geo defaults (`getCurrency`, `getCountryCode`), writes the new team through `trpc.team.create`, locks UI through a mutation ref, runs `revalidateAfterTeamChange()` (invalidating `/` layout, `/teams` data), switches active team (`switchTeam: true`), and finalizes with a server-side `redirect("/")`.
10. **First dashboard render & nudge** – Upon satisfying name + team, `(sidebar)/layout.tsx` hydrates `Sidebar`, `Header`, `ExportStatus`, `GlobalSheets`, `GlobalTimerProvider`, and `TimezoneDetector`; the Overview route (`apps/dashboard/src/app/[locale]/(app)/(sidebar)/page.tsx`) batches TRPC prefetches for charts, widgets, inbox, documents, and transactions. If `Cookies.HideConnectFlow` is absent and `bankAccounts.get` returns empty, `OverviewModal` auto-opens with the “Add account” CTA while `Charts/EmptyState` and `Widgets` disable bank-dependent tiles.

## 2. Connect a Bank Account
1. **Entry points expose `step=connect`** – `OverviewModal` (`apps/dashboard/src/components/modals/overview-modal.tsx`) and `AddAccountButton` set the `step` query parameter via `useQueryState`, while sidebar shortcuts (e.g., `/transactions?step=connect`) do the same.
2. **Global connect sheet mounts** – One of the `GlobalSheets` (`apps/dashboard/src/components/sheets/global-sheets.tsx`) is `SelectBankAccountsModal`, which listens for `step=connect` and presents available aggregators (Teller, Plaid, etc.).
3. **OAuth hand-off & callback** – Connector-specific routes (e.g., `apps/dashboard/src/app/api/connector/callback/route.ts`, `.../api/gocardless/reconnect/route.ts`) exchange authorization codes for access tokens, persist accounts, and redirect back with success state.
4. **Post-connection state refresh** – Successful connections invalidate `trpc.bankAccounts.get`, which re-enables `Charts`, `Spending`, `Transactions`, and clears the Overview empty states; `hideConnectFlowAction` persists `Cookies.HideConnectFlow="true"`, preventing the onboarding modal from reopening.

## 3. Manual Transaction Import
1. **Open the import sheet** – Navigating to `/transactions?step=import&hide=true` (from the sidebar or widget CTA) sets query state picked up by `Transactions` widget and the global Import modal (`apps/dashboard/src/components/modals/import-modal.tsx`).
2. **Upload & parse CSV** – `ImportModal` consumes the `uniqueCurrencies` list, reads user CSV uploads, and streams them to the TRPC import mutation (`trpc.transactions.import`).
3. **Categorise & confirm** – Successful imports invalidate `trpc.transactions.get` and `trpc.transactions.categories`, prompting the widget and full Transactions view to display the new entries for review.
4. **Optional matching** – If bank feeds already exist, the import flow triggers `trpc.transactions.match`, surfacing potential matches directly in the Transactions list (handled in `apps/dashboard/src/components/widgets/transactions/transactions.tsx`).

## 4. Invoice Lifecycle & Workspace
1. **Reach the invoice hub** – The dashboard widget (`apps/dashboard/src/components/widgets/invoice/`) links into `/invoices`, whose page module (`apps/dashboard/src/app/[locale]/(app)/(sidebar)/invoices/page.tsx`) prefetches TRPC queries for invoice lists, summary tiles, and payment status before rendering.
2. **Summaries above the fold** – Cards like `InvoicesOpen`, `InvoicesOverdue`, `InvoicesPaid`, and `InvoicePaymentScore` consume `trpc.invoice.invoiceSummary` and `trpc.invoice.paymentStatus` to surface totals, trends, and risk scores in Suspense-friendly chunks.
3. **Search, filters, and column presets** – `InvoiceHeader` wires up `InvoiceSearchFilter`, `InvoiceColumnVisibility`, and the `OpenInvoiceSheet` button; URL state is parsed by `loadInvoiceFilterParams` and `loadSortParams`, while `getInitialInvoicesColumnVisibility` restores user preferences.
4. **Paginated DataTable** – `DataTable` composes TanStack Table with `useSuspenseInfiniteQuery(trpc.invoice.get)`, stitches pages together, persists column visibility through `updateColumnVisibilityAction`, and streams more rows when the bottom `LoadMore` sentinel (IntersectionObserver) enters view.
5. **Row interactions & detail sidecar** – Clicking any non-action cell sets `useInvoiceParams` to `{ invoiceId, type: "details" }`, opening `InvoiceDetailsSheet`; the sheet hydrates `InvoiceDetails` via `trpc.invoice.getById` and renders metadata, totals, activity (`InvoiceActivity`), and internal notes.
6. **Operational actions** – `InvoiceActions` exposes state-based controls: send reminders (`trpc.invoice.remind`), mark paid/unpaid (`trpc.invoice.update`), schedule deliveries (dropdown calendar), duplicate/edit (swap to `type: "edit"`), and delete (`trpc.invoice.delete`). Each mutation invalidates invoice list queries and summary counts to keep widgets synchronized.
7. **Create or edit in the sheet** – Tapping `OpenInvoiceSheet` or an edit action sets `type: "create" | "edit"`. `InvoiceSheet` pulls default settings (`trpc.invoice.defaultSettings`) or draft data, passes them to `FormContext`, and renders `InvoiceContent` which lazily sizes the sheet, mounts `SettingsMenu`, and hosts the primary `Form`.
8. **Draft autosave & form structure** – `Form` leverages React Hook Form and watches a curated field subset; debounced changes trigger `trpc.invoice.draft` to upsert the draft, update `useInvoiceParams` with the new `invoiceId`, and invalidate related queries. Line items, payment methods, notes, and blocks live in modular subcomponents inside `apps/dashboard/src/components/invoice/`.
9. **Submission, scheduling, and success** – Submitting calls `trpc.invoice.create` with delivery metadata, then swaps the sheet to `type: "success"`. `InvoiceSuccess` reloads the saved invoice, surfaces PDF download (`/api/download/invoice`), share link copy via `CopyInput`, and shortcut buttons (`OpenURL`) to preview or spin up another invoice.
10. **Customer-facing experience** – Shared links resolve to `/i/[token]/page.tsx`, which validates access (`trpc.invoice.getInvoiceByToken`), tracks viewer email via encrypted `viewer` search params, updates `viewed_at` with `waitUntil`, and renders `HtmlTemplate` plus `InvoiceToolbar` for downloading or printing. Drafts or unauthorized viewers still receive `notFound()`, keeping private drafts gated.

## 5. Magic Inbox Triage
1. **Connect an email source** – `ConnectGmail` (`apps/dashboard/src/components/inbox/connect-gmail.tsx`) issues `trpc.inboxAccounts.connect` and routes the user to Google OAuth; upon return, inbox accounts surface through `trpc.inboxAccounts.list` (used in `InboxHeader`).
2. **Ingest documents and emails** – The inbox page (`apps/dashboard/src/app/[locale]/(app)/(sidebar)/inbox/page.tsx`) resolves filter params via `loadInboxFilterParams`, fetches inbox entries with `trpc.inbox.get.infiniteQueryOptions`, and, if empty/unconfigured, shows `InboxGetStarted` with pointers to connect providers or upload PDFs.
3. **Real-time queue updates** – `InboxView` subscribes to `realtime_inbox` via `useRealtime`, batching realtime payloads, refetching inbox data, and auto-selecting the first item by mutating URL/query params with `useInboxParams`.
4. **Review details & attachments** – `InboxDetails` loads the selected item through `trpc.inbox.getById`, displays parsed metadata, embedded `FileViewer`, and exposes actions (download via `downloadFile`, copy link, open original email). Toolbar buttons call mutations (`trpc.inbox.update`, `trpc.inbox.retryMatching`, `trpc.inbox.delete`) with optimistic cache updates so the list responds instantly.
5. **Match to transactions or mark done** – `InboxActions`, `MatchTransaction`, and `SuggestedMatch` components trigger TRPC mutations to confirm matches (`trpc.inbox.matchTransaction`), create new transactions, or mark the item as resolved; query invalidations keep `trpc.transactions.get` and `trpc.inbox.get` in sync so both Inbox and Transactions widgets reflect the status change.

## 6. Assistant Insights & Automation
1. **Launch the assistant from anywhere** – The Overview widget (`apps/dashboard/src/components/widgets/assistant/`) exposes chat examples and an inline input; focusing the input or clicking a suggestion calls `useAssistantStore.setOpen` to toggle the shared Zustand store (`apps/dashboard/src/store/assistant.ts`). The modal wrapper (`apps/dashboard/src/components/assistant/assistant-modal.tsx`) is registered in `GlobalSheets`, so the assistant is always available without extra routing.
2. **Modal shell & conversational UI** – `Assistant` (`apps/dashboard/src/components/assistant/index.tsx`) lays out the header and `Chat` component. `Chat` (`apps/dashboard/src/components/chat/index.tsx`) uses the Vercel `useChat` hook, pipes the stored quick-prompt message into the stream on open, and personalises empty states with `useUserQuery` data; `ChatExamples`, `ChatInput`, and `ChatFooter` coordinate keyboard submission UX.
3. **Streaming request pipeline** – Submissions post to `/api/chat` (`apps/dashboard/src/app/api/chat/route.ts`), which wraps OpenAI `gpt-4.1-mini` with `createDataStreamResponse`. The route defines the finance-focused system prompt, enables up to five tool calls, and merges reasoning + word-level tokens back to the client for smooth streaming.
4. **Domain tools backing answers** – Each tool lives under `apps/dashboard/src/lib/tools/` and wraps TRPC server queries via `getQueryClient`; examples include `getTransactions`, `getDocuments`, `getInbox`, `getRevenue`, `getProfit`, `getBurnRate`, `getRunway`, `getSpending`, `getForecast`, and `getTaxSummary`. Tool schemas (Zod) constrain parameters like date ranges, filters, and page sizes so the model always returns structured payloads (`params`, `result`, `meta`).
5. **Rendering tool artifacts** – On the client, `PreviewMessage` (`apps/dashboard/src/components/chat/message.tsx`) inspects `tool-invocation` parts and delegates to UI renderers: transactions tables (`.../chat/tools/transactions/transactions.tsx`), revenue/profit/burn rate summaries, inbox/vault previews (`.../chat/tools/inbox/inbox.tsx`, `.../chat/tools/documents/documents.tsx`), etc. These components trigger follow-up React Query calls to hydrate full datasets before drawing `Table`, `FilePreview`, or KPI cards.
6. **Escalating to primary workflows** – Tool components surface bridges back into the core app: `ShowMoreButton` pushes `/transactions` while closing the modal, vault previews mount `VaultItemActions` for download/open in Vault, and inbox/document results reuse `FilePreview` so users can act on matched receipts immediately.
7. **Embedded assistant shortcuts** – Beyond the modal, contextual helpers reuse the same AI stack. For example, `TaxRateAssistant` (`apps/dashboard/src/components/tax-rate-assistant.tsx`) debounces product names, calls `getTaxRateAction`, and auto-populates form inputs; transaction tool cards trigger `useAssistantStore.setOpen` to re-open the assistant seeded with follow-up prompts, keeping AI responses attached to the relevant workflow.

## 7. App Store & Integrations Hub
1. **Load the Apps workspace** – `/apps` (`apps/dashboard/src/app/[locale]/(app)/(sidebar)/apps/page.tsx`) prefetches three TRPC queries before hydration: `trpc.apps.get` (installed official integrations), `trpc.oauthApplications.list` (all approved external apps), and `trpc.oauthApplications.authorized` (connections the current team has already approved). The page renders `AppsHeader` above a Suspense-wrapped `Apps` grid.
2. **Tabbing & search state** – `AppsHeader` combines `AppsTabs` (controlled by `useQueryState('tab')`) with the shared `SearchField`. Switching tabs rewrites the `tab` query parameter (default `all`, alternative `installed`), while updating the search box mutates `q`. Both params are consumed downstream without a full reload.
3. **Unifying official & external apps** – `Apps` fetches data through React Query’s `useSuspenseQuery` (mirroring the server prefetch) and normalizes each source into a single `UnifiedApp` shape: Zeke-maintained apps enrich metadata from `@zeke/app-store`, while approved OAuth apps map properties such as scope lists, contact info, and install URLs. The combined array is filtered based on the active tab and search query.
4. **Grid rendering & empty states** – The component lays apps out in a responsive grid of `UnifiedAppComponent` cards. If no installed apps exist (installed tab, no results) it shows a “No apps installed” message; if a search yields nothing the UI offers a “Clear search” button that resets to `/apps` via `router.push`.
5. **Card-level actions** – Each `UnifiedAppComponent` card shows logo, description, and primary CTAs. Clicking “Details” sets `useQueryStates({ app: id })`, opening a sheet; “Install” triggers either `app.onInitialize()` for official apps or `window.open/installUrl` for external apps (using desktop deep-link helpers when needed). An installed app shows “Disconnect”, which calls either `trpc.apps.disconnect` or `trpc.oauthApplications.revokeAccess` and invalidates the relevant TRPC caches.
6. **Detail sheet experience** – The sheet (still in `UnifiedAppComponent`) previews screenshots via `Carousel`/`Image` components, repeats install/disconnect controls, and presents sections through `Accordion`: “How it works” (long description/overview), “Settings” (for official apps with configurable options), “Website” and “Permissions” (external app metadata rendered via badges using `getScopeDescription`). Copy at the bottom clarifies certification and support expectations.
7. **Managing official app settings** – When an official app exposes configuration, the sheet renders `AppSettings`. Each setting row feeds `trpc.apps.update` on toggle, persists the option, and invalidates `trpc.apps.get` so the main list reflects the new state and other users see updated defaults.
8. **Authorized OAuth management** – External apps use `authorizedExternalApps` to mark installation state and show `lastUsedAt`. Revoking access updates that query, so the “Installed” pill vanishes immediately and the app appears in the “All” tab as available for re-installation.
9. **Navigation shortcuts** – Because `useQueryStates` powers both the sheet (`app`) and settings (`settings` boolean flag), deep links such as `/apps?app=teller&settings=true` open the details drawer directly with the settings accordion pre-expanded, enabling contextual navigation from notifications or assistant suggestions.

## 8. Transactions Flow

1. **Server bootstraps the transactions workspace** by loading URL filters and sort params, getting initial column visibility, and pre-hydrating the infinite TRPC query before returning the Suspense-wrapped table (`apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/page.tsx:1`).

2. **The search/filter bar** persists user criteria in the query string, supports AI-generated filters, and lazily hydrates tags, bank accounts, categories, amount ranges, statuses, recurring flags, assignees, and attachments when opened (`apps/dashboard/src/components/transactions-search-filter.tsx:1`, `apps/dashboard/src/hooks/use-transaction-filter-params.ts:1`, `apps/dashboard/src/hooks/use-transaction-filter-params-with-persistence.ts:1`).

3. **The client data table** streams transaction pages with `useSuspenseInfiniteQuery`, polls until enrichment finishes, tracks row selection in Zustand, wires sticky columns + horizontal scroll, and exposes table meta callbacks for opening detail sheets, copying URLs, mutating statuses, or deleting single rows (`apps/dashboard/src/components/tables/transactions/data-table.tsx:1`, `apps/dashboard/src/components/tables/transactions/columns.tsx:1`, `apps/dashboard/src/store/transactions.ts:1`).

4. **Column layouts persist** for a year via the server action writing to cookie storage, while the column-visibility popover emits per-column toggles constrained by the table's hiding rules (`apps/dashboard/src/actions/update-column-visibility-action.ts:1`, `apps/dashboard/src/components/transactions-column-visibility.tsx:1`).

5. **Row selection unlocks bulk surfaces**: the action bar flips to AI-assisted category/tag pickers, assignment, recurring cadence controls, exclude/archive toggles, and guarded deletes, all delegating to `transactions.updateMany` / `deleteMany` mutations before clearing selection (`apps/dashboard/src/components/transactions-actions.tsx:1`, `apps/dashboard/src/components/bulk-actions.tsx:1`).

6. **The add-menu** seeds query-state to launch global sheets that connect bank feeds, open the import/backfill modal, or display the manual creation form; the sheets are globally registered so the flow is available from anywhere in the app (`apps/dashboard/src/components/add-transactions.tsx:1`, `apps/dashboard/src/components/sheets/global-sheets.tsx:1`, `apps/dashboard/src/components/sheets/transaction-create-sheet.tsx:1`, `apps/dashboard/src/components/forms/transaction-create-form.tsx:1`).

7. **Selection-aware overlays** handle exports and analytics summaries: the export bar kicks off the safe-action job and stores run metadata, while the bottom bar recomputes multi-currency totals for the current filter set (`apps/dashboard/src/components/tables/transactions/export-bar.tsx:1`, `apps/dashboard/src/components/tables/transactions/bottom-bar.tsx:1`).

8. **Row menus and keyboard affordances** let users copy shareable links, jump into details, flip statuses, or mark items completed via ⌘+M; arrow keys move through the infinite list and Esc closes the detail sheet (`apps/dashboard/src/components/tables/transactions/columns.tsx:139`, `apps/dashboard/src/components/tables/transactions/data-table.tsx:135`, `apps/dashboard/src/components/transaction-shortcuts.tsx:1`).

9. **Detail edits** happen inside the transaction sheet, which hydrates from cached list data, optimistically updates TRPC caches, cascades invalidations, and exposes category, assignment, tagging, internal/recurring toggles, notes, suggested inbox matches, and quick toasts to bulk-apply similar classifications (`apps/dashboard/src/components/sheets/transaction-sheet.tsx:1`, `apps/dashboard/src/components/transaction-details.tsx:1`, `apps/dashboard/src/components/suggested-match.tsx:1`).

10. **Attachment ingestion** streams uploads to MinIO storage, calls the attachment processor, polls for extracted tax data, and announces when the tax engine synchronizes amounts back onto the transaction (`apps/dashboard/src/components/transaction-attachments.tsx:1`).

11. **All UI paths backstop** onto the TRPC router that wraps CRUD, bulk updates, similarity search, inbox matching, analytics ranges, and manual creation (which also triggers embedding jobs) under team-aware protected procedures (`apps/api/src/trpc/routers/transactions.ts:1`).

### Transactions Actions

1. **Search, filter, or let AI propose filter presets** across text, dates, accounts, categories, tags, statuses, recurring flags, attachment presence, assignees, and amount ranges (`apps/dashboard/src/components/transactions-search-filter.tsx:1`).

2. **Tailor the table layout** by turning columns on/off and persisting the configuration in cookies (`apps/dashboard/src/components/transactions-column-visibility.tsx:1`, `apps/dashboard/src/actions/update-column-visibility-action.ts:1`).

3. **Select rows to bulk-change** categories, tags, assignees, statuses, recurring cadence, or exclusion/archive flags, and optionally delete the selection with confirmation (`apps/dashboard/src/components/bulk-actions.tsx:1`, `apps/dashboard/src/components/transactions-actions.tsx:1`).

4. **Export a selected subset** with locale-aware formatting, then reset the selection once the safe-action run is queued (`apps/dashboard/src/components/tables/transactions/export-bar.tsx:1`).

5. **Launch new data ingestion** via connect (bank feeds), import/backfill uploads, or manual transaction creation (`apps/dashboard/src/components/add-transactions.tsx:1`, `apps/dashboard/src/components/forms/transaction-create-form.tsx:1`).

6. **Open a transaction sheet** to edit metadata (description, amounts, category, assignment, tags, notes), toggle internal/recurring states, manage attachments, and review suggested inbox matches (`apps/dashboard/src/components/transaction-details.tsx:1`).

7. **Accept or decline AI-suggested inbox matches**, preview linked documents, and teach the matcher for future accuracy (`apps/dashboard/src/components/suggested-match.tsx:1`).

8. **Upload or link receipts** to trigger OCR-driven tax extraction and keep document associations current (`apps/dashboard/src/components/transaction-attachments.tsx:1`).

9. **Use keyboard shortcuts** (⌘+M, arrow keys, Esc) or row menus to navigate, copy share URLs, and flip statuses without leaving the table (`apps/dashboard/src/components/tables/transactions/columns.tsx:139`, `apps/dashboard/src/components/transaction-shortcuts.tsx:1`).

10. **Review real-time totals** for filtered results, ensuring analytics reflect the current slice before acting further (`apps/dashboard/src/components/tables/transactions/bottom-bar.tsx:1`).


## 9. Customers Workspace & Lifecycle

1. **Prefetch customer dataset & metrics** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/customers/page.tsx` normalises query params via `loadCustomerFilterParams` / `loadSortParams`, primes `trpc.customers.get.infiniteQueryOptions` with `getQueryClient().fetchInfiniteQuery`, and batchPrefetches analytics (`trpc.invoice.mostActiveClient`, `inactiveClientsCount`, `topRevenueClient`, `newCustomersCount`) backed by `packages/db/src/queries/invoices.ts` and `packages/db/src/queries/customer-analytics.ts`.

2. **Hydrate layout & surface KPI cards** – The page wraps its tree in `HydrateClient`, rendering four Suspense-driven cards (`MostActiveClient`, `InactiveClients`, `TopRevenueClient`, `NewCustomersThisMonth`) with `InvoiceSummarySkeleton` fallbacks; each client component streams TRPC queries, formats currency via `FormatAmount`, and handles empty states for the past-30-day window.

3. **Search-first header controls** – `CustomersHeader` combines the querystring-backed `SearchField` (ESC to clear `q`) with `OpenCustomerSheet`, which toggles `useCustomerParams({ createCustomer: true })`; larger screens keep the add button visible while global surfaces (main menu, command palette) link to the same `?createCustomer=true` state.

4. **Shared filter & sort state** – `useCustomerFilterParams`/`useSortParams` (Nuqs) synchronise `q`, `start`, `end`, and `[column,direction]` tuples across URL, server loader, and client; `TableHeader` exposes sortable buttons that cycle asc/desc/clear and mirrors scroll position via `useTableScroll` + `HorizontalPagination`.

5. **Infinite customer table rendering** – `DataTable` defers heavy search input with `useDeferredValue`, streams pages through `useSuspenseInfiniteQuery`, flattens them, and auto-fetches the next cursor when `LoadMore` hits `useInView`; it wires table meta for deletion, sticky columns, and delegates cell rendering to `columns.tsx`.

6. **Row interactions & cross-navigation** – `CustomerRow` opens the edit sheet on most cell clicks, while column renderers link invoices (`/invoices?customers=...`), tracker projects (`/tracker?customers=...`), and tag badges (`/transactions?tags=...`), providing fast pivots across modules without manual filter entry.

7. **Error and empty safeguards** – The grid wraps `DataTable` in `ErrorBoundary` (`ErrorFallback`) and `Suspense` (`CustomersSkeleton`); `EmptyState` and `NoResults` reuse `useCustomerParams` to either open creation or clear filters, ensuring FTUX-friendly nudges.

8. **Create customer sheet lifecycle** – `CustomerCreateSheet` listens to `createCustomer` state, mounts `CustomerForm`, and submits via `trpc.customers.upsert`; the form auto-populates website domains on email blur, supports address lookup (`SearchAddressInput`), `CountrySelector`, VAT validation, tag selection, and on success invalidates `trpc.customers.get`, `getById`, `search.global`, closes the sheet, and if invoked from an invoice context sets `useInvoiceParams({ selectedCustomerId })`.

9. **Edit & delete workflows** – `CustomerEditSheet` watches `customerId`, hydrates details with `trpc.customers.getById` (seeded from cached pages when available), reuses `CustomerForm`, and exposes a `DropdownMenu` → `AlertDialog` path for deletion; `trpc.customers.delete` invalidates lists and closes the sheet, returning the removed payload from `packages/db/src/queries/customers.ts`.

10. **Backend orchestration & activity logging** – `packages/db/src/queries/customers.ts` powers list pagination (full-text search via `buildSearchQuery`, count aggregates, cursor math), upsert (Drizzle `onConflictDoUpdate`, tag diffing, token generation), deletion, and automatically emits a `customer_created` activity via `createActivity`; `GlobalSheets` keeps both create/edit sheets registered app-wide so tracker projects, invoices, and global search can launch customer flows in-context.

### Customer Lifecycle Actions

1. **Search customers** by name/email using the header field (`?q=`).

2. **Sort** by name, contact, email, invoice count, project count, or tags directly from the table header.

3. **Scroll to auto-load** additional pages through the infinite list.

4. **Open the "Create Customer" sheet** from the header button, empty state, command palette, or other modules.

5. **Submit the customer form** to create/update records (with optional tags, VAT, addresses, notes).

6. **Auto-fill website domains** by blurring the email field on creation/edit.

7. **Select or remove tags** to categorise customers and drive downstream expense filtering.

8. **Jump to filtered invoices**, tracker projects, or tagged transactions via in-row links.

9. **Open an existing customer** by clicking a row to review or edit details.

10. **Save edits** to refresh all customer lists and global search references.

11. **Delete a customer** through the row action menu and confirmation dialog.

12. **Clear filters/reset state** from the "No results" prompt to return to the full list.



## 10. Settings & Team Administration

1. **Secondary menu scaffolds the lifecycle** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/layout.tsx:1` wraps the settings subtree, injecting SecondaryMenu to expose General, Billing, Accounts, Members, Notifications, and Developer tabs; the client-only nav (`apps/dashboard/src/components/secondary-menu.tsx:1`) uses usePathname and prefetched Links so every hop keeps locale context and highlights the active section.
2. **General tab prefetches team state and surfaces identity controls** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/page.tsx:1` primes trpc.team.current and renders CompanyLogo, CompanyName, CompanyEmail, CompanyCountry, and DeleteTeam, ensuring all team metadata is hydrated before interactive mutations.
3. **Company logo upload pipeline** – `apps/dashboard/src/components/company-logo.tsx:1` binds useTeamQuery, useUpload, and useTeamMutation; clicking the avatar uses stripSpecialCharacters to sanitize the filename, streams to the avatars bucket, then persists logoUrl so downstream avatars update in place.
4. **Company details forms validate and persist** – `apps/dashboard/src/components/company-name.tsx:1`, `apps/dashboard/src/components/company-email.tsx:1`, and `apps/dashboard/src/components/company-country.tsx:1` share the useZodForm scaffold, pushing mutations through useTeamMutation, gating submission with SubmitButton, and (for country) relaying CountrySelector events back to the form state.
5. **Team deletion guardrails** – `apps/dashboard/src/components/delete-team.tsx:1` reads the active user via useUserQuery, opens an AlertDialog flow that requires typing "DELETE", and on success triggers trpc.team.delete plus a redirect to /teams so the user lands on team selection.
6. **Billing tab orchestrates subscription and order history** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/billing/page.tsx:1` fetches trpc.user.me, inspects team.plan, and conditionally shows ManageSubscription, Plans, or Orders; ManageSubscription (`apps/dashboard/src/components/manage-subscription.tsx:1`) links to the billing portal, Plans (`apps/dashboard/src/components/plans.tsx:1`) drives checkout links with availability tooltips, and Orders (`apps/dashboard/src/components/orders.tsx:1`) wraps the order ledger in Suspense.
7. **Orders ledger & invoice downloads** – OrdersDataTable (`apps/dashboard/src/components/tables/orders/data-table.tsx:1`) pages via useSuspenseInfiniteQuery and exposes Load more, while ActionsMenu (`apps/dashboard/src/components/tables/orders/actions-menu.tsx:1`) kicks off trpc.billing.getInvoice, polls checkInvoiceStatus, streams toast-based progress, and auto-downloads ready PDFs.
8. **Accounts tab primes connections and manual balances** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/accounts/page.tsx:1` prefetches trpc.bankConnections.get, bankAccounts.get({ manual: true }), and team.current, then renders ConnectedAccounts with an "Add account" CTA (via AddAccountButton) followed by BaseCurrency.
9. **Bank connection controls & manual accounts** – ConnectedAccounts (`apps/dashboard/src/components/connected-accounts.tsx:1`) embeds BankConnections and ManualAccounts; BankConnections (`apps/dashboard/src/components/bank-connections.tsx:1`) resolves health via connectionStatus, reacts to query params for reconnects, and wires manual sync (`manual-sync-transactions-action.ts:1`) plus reconnect jobs (`reconnect-connection-action.ts:1`); per-account rows (`apps/dashboard/src/components/bank-account.tsx:1`) expose edit (`edit-bank-account-modal.tsx:1`), import (nuqs query state), enable toggles, and guarded deletes, while connection-level removes funnel through `delete-connection.tsx:1`; manual ledgers render via `manual-accounts.tsx:1`.
10. **Base currency revaluation flow** – `apps/dashboard/src/components/base-currency/base-currency.tsx:1` hosts SelectCurrency, whose client hook (`apps/dashboard/src/components/base-currency/select-currency.tsx:1`) updates the team record, prompts a confirmation toast, replays the safe action team.updateBaseCurrency, and monitors useSyncStatus (`apps/dashboard/src/hooks/use-sync-status.ts:1`) so users get spinner/success/error feedback as Trigger.dev finishes recalculations.
11. **Membership & invitations management** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/members/page.tsx:1` prefetches trpc.team.members and team.teamInvites before TeamMembers (`apps/dashboard/src/components/team-members.tsx:1`) mounts tabs for active users and pending invites; the members grid (`apps/dashboard/src/components/tables/members/index.tsx:1`) supports search filters, role switches, removal, and leave-team flows via `columns.tsx:1`, while InviteTeamMembersModal + InviteForm (`apps/dashboard/src/components/forms/invite-form.tsx:1`) batch-sends invites with granular toast feedback; pending invites reuse the table scaffold (`apps/dashboard/src/components/tables/pending-invites/index.tsx:1`) and allow per-role review/deletion (`columns.tsx:1`).
12. **Notification preferences** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/notifications/page.tsx:1` wraps NotificationsSettingsList (`apps/dashboard/src/components/notifications-settings-list.tsx:1`), which guards the tree with ErrorBoundary and Suspense; NotificationSettings (`apps/dashboard/src/components/notification-settings.tsx:1`) groups TRPC data by category, while NotificationSetting (`apps/dashboard/src/components/notification-setting.tsx:1`) optimistically flips per-channel checkboxes and rolls back on failure before invalidating notificationSettings.getAll.
13. **Developer credentials hub (API Keys)** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/settings/developer/page.tsx:1` batch-prefetches trpc.apiKeys.get and oauthApplications.list, then renders the API key table (`apps/dashboard/src/components/tables/api-keys/index.tsx:1`) with scope badges and action menus (`columns.tsx:1`); modal state lives in useTokenModalStore (`apps/dashboard/src/store/token-modal.ts:1`), and the lifecycle flows through CreateApiKeyModal, EditApiKeyModal, DeleteApiKeyModal (all in `apps/dashboard/src/components/modals/*.tsx`), with ApiKeyForm (`apps/dashboard/src/components/forms/api-key-form.tsx:1`) handling preset tabs, restricted scope selection (ScopeSelector), and mutations that return a one-time secret for new keys.
14. **OAuth application lifecycle** – OAuthDataTable (`apps/dashboard/src/components/tables/oauth-applications/index.tsx:1`) uses useOAuthApplicationParams (`apps/dashboard/src/hooks/use-oauth-application-params.ts:1`) to drive sheets; rows open edit or trigger dropdown actions (`columns.tsx:1`) including copy client ID, submit/cancel review, and delete (with confirmation via DeleteOAuthApplicationModal: `apps/dashboard/src/components/modals/delete-oauth-application-modal.tsx:1`); OAuthApplicationCreateSheet/EditSheet (`apps/dashboard/src/components/sheets/*.tsx`) host OAuthApplicationForm (`apps/dashboard/src/components/forms/oauth-application-form.tsx:1`), which uploads logos/screenshots through useUpload, enforces redirect URI validation, manages scope presets, and toggles PKCE/active flags; successful creates surface a one-time secret in OAuthSecretModal (`apps/dashboard/src/components/modals/oauth-secret-modal.tsx:1`) powered by useOAuthSecretModalStore (`apps/dashboard/src/store/oauth-secret-modal.ts:1`).

### Settings Actions

1. **Navigate between General, Billing, Accounts, Members, Notifications, and Developer** via the secondary menu (`apps/dashboard/src/components/secondary-menu.tsx:1`).
2. **Upload or replace the company logo** with immediate team-wide updates (`apps/dashboard/src/components/company-logo.tsx:1`).
3. **Edit and save company name, email, and country settings** (`apps/dashboard/src/components/company-name.tsx:1`, `.../company-email.tsx:1`, `.../company-country.tsx:1`).
4. **Permanently delete the active team** after confirmation (`apps/dashboard/src/components/delete-team.tsx:1`).
5. **Launch the billing portal, choose a subscription plan, or review plan availability cues** (`apps/dashboard/src/components/manage-subscription.tsx:1`, `.../plans.tsx:1`).
6. **Page through historical orders, load more records, and download billing invoices** (`apps/dashboard/src/components/tables/orders/data-table.tsx:1`, `.../actions-menu.tsx:1`).
7. **Add a new bank connection from settings** using the global step=connect sheet (`apps/dashboard/src/components/connected-accounts.tsx:1`, `.../add-account-button.tsx:1`).
8. **Reconnect, sync, edit, enable/disable, import, or delete existing bank accounts and connections** (`apps/dashboard/src/components/bank-connections.tsx:1`, `.../bank-account.tsx:1`, `.../sync-transactions.tsx:1`, `.../delete-connection.tsx:1`).
9. **Inspect and adjust manual accounts** alongside linked connections (`apps/dashboard/src/components/manual-accounts.tsx:1`).
10. **Change the team's base currency and trigger a full revaluation sync** (`apps/dashboard/src/components/base-currency/select-currency.tsx:1`).
11. **Search members, modify roles, remove teammates, or leave the team yourself** (`apps/dashboard/src/components/tables/members/index.tsx:1`, `.../columns.tsx:1`).
12. **Send new invitations, batch multiple emails, or revoke pending invites** (`apps/dashboard/src/components/forms/invite-form.tsx:1`, `.../tables/pending-invites/columns.tsx:1`).
13. **Toggle in-app, email, or push notifications per event category** (`apps/dashboard/src/components/notification-setting.tsx:1`).
14. **Create, edit, or delete API keys, adjust scope presets, and copy freshly issued secrets** (`apps/dashboard/src/components/forms/api-key-form.tsx:1`, `.../modals/create-api-key-modal.tsx:1`).
15. **Create, edit, submit for review, copy credentials for, or delete OAuth applications** while managing assets and redirect URIs (`apps/dashboard/src/components/forms/oauth-application-form.tsx:1`, `.../sheets/oauth-application-edit-sheet.tsx:1`).


## 11. Tracker Lifecycle
1. **Read tracker query params and mount skeletons** – `apps/dashboard/src/app/[locale]/(app)/(sidebar)/tracker/page.tsx:1` reads tracker query params, restores the Week/Month cookie (`Cookies.WeeklyCalendar`), prefetches `trpc.trackerProjects.get`, and mounts the calendar + project table skeletons under Suspense.
2. **View state, URL params, and cookie persistence** – Flow through `useTrackerParams` (`apps/dashboard/src/hooks/use-tracker-params.ts:1`) and the `setWeeklyCalendarAction` (`apps/dashboard/src/actions/set-weekly-calendar-action.ts:1`), so toggling layout or opening sheets updates both the URL and a 1-year cookie.
3. **Hydrate calendar grids and surface totals** – `TrackerCalendar` (`apps/dashboard/src/components/tracker-calendar.tsx:1`) and its header (`apps/dashboard/src/components/tracker/calendar-header.tsx:1`) hydrate weekly/monthly grids via `trpc.trackerEntries.byRange`, surface total tracked time, and feed the earnings hovercard computed in `total-earnings.tsx:1`.
4. **Calendar interactions combine multiple components** – Drag-to-select, arrow-key paging, week/month tabs, time-format tweaks combine `TrackerCalendarType` (`apps/dashboard/src/components/tracker-calendar-type.tsx:1`), `TrackerPeriodSelect` (`apps/dashboard/src/components/tracker-period-select.tsx:1`), and `TrackerSettings` (`apps/dashboard/src/components/tracker-settings.tsx:1`) with `useTrackerParams` so every selection reflects in the URL and stored preferences.
5. **Opening the scheduler sheet** – `apps/dashboard/src/components/sheets/tracker-schedule-sheet.tsx:1` loads `TrackerSchedule` (`apps/dashboard/src/components/tracker-schedule.tsx:1`), which queries `trpc.trackerEntries.byDate`, creates placeholder events, supports drag-to-create, drag-and-drop moves, resize handles, midnight-spanning entries, context-menu delete, and keeps selection synced with `TrackerDaySelect` (`apps/dashboard/src/components/tracker-day-select.tsx:1`).
6. **Inline form drives entry upserts** – The inline `TrackerEntriesForm` (`apps/dashboard/src/components/forms/tracker-entries-form.tsx:1`) drives entry upserts through `trpc.trackerEntries.upsert`, defaulting project/assignee from `useLatestProjectId` (`apps/dashboard/src/hooks/use-latest-project-id.ts:1`) and converting user-local times to UTC-safe payloads.
7. **Real-time timers with cross-tab updates** – Run through `TrackerTimer` (`apps/dashboard/src/components/tracker-timer.tsx:1`), which hooks `useGlobalTimerStatus` (`apps/dashboard/src/hooks/use-global-timer-status.ts:1`) for live elapsed time, starts/stops timers via the TRPC mutations (`apps/api/src/trpc/routers/tracker-entries.ts:1`), and exposes hold-to-stop safety plus cross-tab document-title updates.
8. **Search and filter state management** – Lives in `TrackerSearchFilter` (`apps/dashboard/src/components/tracker-search-filter.tsx:1`), which streams AI-generated presets (`apps/dashboard/src/actions/ai/filters/generate-tracker-filters.ts:1`), hydrates customers/tags/members as needed, and applies filters through `useTrackerFilterParams` (`apps/dashboard/src/hooks/use-tracker-filter-params.ts:1`).
9. **Projects data table with pagination** – `apps/dashboard/src/components/tables/tracker/index.tsx:1` paginates via `useSuspenseInfiniteQuery`, tracks the last-opened project in local storage, and renders rows (`.../data-table-row.tsx:1`) that embed timers, customer avatars, allocation badges, tags, assigned teammates, status pills (`apps/dashboard/src/components/tracker-status.tsx:1`), and row menus for edit/delete/invoice/export.
10. **Project creation and editing through global sheets** – Flow through the global sheets (`apps/dashboard/src/components/sheets/global-sheets.tsx:1`) which host `TrackerCreateSheet` (`.../tracker-create-sheet.tsx:1`), `TrackerUpdateSheet` (`.../tracker-update-sheet.tsx:1`), and the shared `TrackerProjectForm` (`apps/dashboard/src/components/forms/tracker-project-form.tsx:1`) for billable toggles, hourly rates, tags, customer search, and status changes.
11. **Invoicing and exports integration** – Tie into downstream systems: `TrackerCreateInvoice` (`apps/dashboard/src/components/tracker-create-invoice.tsx:1`) calls `trpc.invoice.createFromTracker` (`apps/api/src/trpc/routers/invoice.ts:166`) to draft pre-filled invoices, while `TrackerExportCSV` (`apps/dashboard/src/components/tracker-export-csv.tsx:1`) fetches entry ranges and downloads CSVs including total-time footers.
12. **Dashboard widget mirrors main schedule** – `apps/dashboard/src/components/widgets/tracker/tracker-widget.tsx:1` mirrors month selection, highlights busy days, and routes users into the tracker via shared params, keeping totals aligned with the main schedule. All reads/writes ultimately flow through the TRPC routers (`apps/api/src/trpc/routers/tracker-projects.ts:1`, `tracker-entries.ts:1`) backed by the Drizzle queries (`packages/db/src/queries/tracker-projects.ts:1`, `packages/db/src/queries/tracker-entries.ts:1`) that calculate totals, enforce team scoping, and log activities.

### Tracker Actions

1. **Toggle between week and month calendars**
   Persisted via `TrackerCalendarType` and `setWeeklyCalendarAction`.

2. **Page forward/back through periods**
   Done with `TrackerPeriodSelect`, which updates the date param.

3. **Drag across the calendar grid**
   Opens the schedule sheet pre-populated with a date range
   *(TrackerCalendar → TrackerScheduleSheet)*

4. **Start or stop a project timer**
   Triggered from the sticky project row (`TrackerTimer`), including hold-to-stop safety.

5. **Prompt the AI to build complex filters**
   Or manually add filters for customers, tags, status, or date ranges
   *(TrackerSearchFilter)*

6. **Create a new tracker project**
   Flow: Add button → `TrackerCreateSheet` → `TrackerProjectForm`.
   Optionally mark it billable with rates and tags.

7. **Edit or delete an existing project**
   Available from the row menu or edit sheet (`TrackerUpdateSheet` with alert-protected delete).

8. **Resize, move, or delete individual time entries**
   Inside the scheduler via drag handles, drag-and-drop, or context-menu delete
   *(TrackerSchedule)*

9. **Assign time entries to teammates or different projects**
   Done directly inside `TrackerEntriesForm`.

10. **Generate a draft invoice**
    From tracked hours within a selected range (`TrackerCreateInvoice`) and open it for editing.

11. **Export project hours to CSV**
    For a chosen date window (`TrackerExportCSV`).

12. **Jump in via the dashboard Tracker widget**
    Select busy days and open the schedule or project detail modals (`TrackerWidget`).

## 12. Desktop Shell & Integration

1. **Bootstraps Zeke shell & main window**
   Tauri exposes `show_window` and `check_for_updates` commands, resolves the hosted URL per `ZEKE_ENV`, and builds the primary webview with custom chrome plus external-link guarding
   *(apps/desktop/src-tauri/src/lib.rs:20, :312, :384, :465, :486)*

2. **Global search window lifecycle**
   A shared `SearchWindowState`, lazy `create_preloaded_search_window`, and focus/blur auto-hide logic keep the `/desktop/search` webview in sync with state changes
   *(apps/desktop/src-tauri/src/lib.rs:118, :246, :400, :532)*

3. **Tray & shortcut orchestration**
   `Shift+Alt+K` and a tray-icon click toggle search, while the tray menu can trigger the update checker and exit requests hide windows instead of quitting
   *(apps/desktop/src-tauri/src/lib.rs:414, :578, :621)*

4. **Next.js desktop provider bridge**
   Providers always mount `DesktopProvider`, which emits `show_window`, wires deep links, and listens for `desktop-navigate` / `desktop-navigate-with-params` events so the Tauri shell and router stay aligned
   *(apps/dashboard/src/app/[locale]/providers.tsx:14, apps/dashboard/src/components/desktop-provider.tsx:17, :46, :86, :134, packages/desktop-client/src/core.ts:1, packages/desktop-client/src/platform.ts:10)*

5. **Desktop-only chrome & detection**
   The root layout toggles the `desktop` class based on the custom user agent, renders the draggable header, and surfaces traffic-light controls that delegate to Tauri window APIs
   *(apps/dashboard/src/app/[locale]/layout.tsx:79, apps/dashboard/src/utils/desktop.ts:3, apps/dashboard/src/components/desktop-header.tsx:7, apps/dashboard/src/components/desktop-traffic-light.tsx:5)*

6. **Authentication deep-link loop**
   OAuth buttons append `client=desktop`, the callback route detours to `/verify`, and `DesktopSignInVerifyCode` pushes a `zeke://` URL that the desktop listener picks up to resume the session
   *(apps/dashboard/src/components/google-sign-in.tsx:11, apps/dashboard/src/app/api/auth/callback/route.ts:20, apps/dashboard/src/app/[locale]/(public)/verify/page.tsx:7, apps/dashboard/src/components/desktop-sign-in-verify-code.tsx:11, apps/desktop/src-tauri/src/lib.rs:362)*

7. **Deep-link & navigation handling**
   Tauri emits `deep-link-navigate` to the main window; `listenForDeepLinks` and the router fan those into in-app navigation while non-main windows ignore them
   *(packages/desktop-client/src/platform.ts:4, apps/desktop/src-tauri/src/lib.rs:459, apps/dashboard/src/components/desktop-provider.tsx:86)*

8. **Desktop search workspace**
   The `/desktop/search` route hosts the command palette. The search component closes the floating window, shows the main window, and emits navigation events back to Tauri when results are selected
   *(apps/dashboard/src/app/[locale]/(app)/desktop/search/page.tsx:6, apps/dashboard/src/components/search/search.tsx:15, :148, :214, apps/desktop/src-tauri/src/lib.rs:118, apps/dashboard/src/middleware.ts:12)*

9. **Downloads & external links**
   The webview intercepts outbound navigation to open system browsers, while React helpers route file downloads and CTA links through Tauri’s opener plugin
   *(apps/desktop/src-tauri/src/lib.rs:486, apps/dashboard/src/lib/download.ts:4, apps/dashboard/src/components/open-url.tsx:7)*

10. **Banking & checkout return paths**
    Institution actions tag state with `desktop:*`, server routes translate provider callbacks into `zeke://` destinations, and the checkout hand-off mirrors the same pattern before bouncing users back into the shell
    *(apps/dashboard/src/actions/institutions/create-enablebanking-link.ts:10, apps/dashboard/src/actions/institutions/reconnect-enablebanking-link.ts:9, apps/dashboard/src/app/api/enablebanking/session/route.ts:6, apps/dashboard/src/actions/institutions/reconnect-gocardless-link.ts:9, apps/dashboard/src/app/api/gocardless/reconnect/route.ts:6, apps/dashboard/src/app/api/checkout/success/route.ts:3, apps/dashboard/src/app/[locale]/(app)/desktop/checkout/success/page.tsx:3, apps/dashboard/src/components/checkout-success-desktop.tsx:11)*

---

### Desktop Lifecycle Actions

1. Launch or refocus the Zeke window via the tray icon, Dock, or deep-link
   *(apps/desktop/src-tauri/src/lib.rs:20, :621)*

2. Toggle the floating search palette with `Shift+Alt+K` or the tray icon
   *(apps/desktop/src-tauri/src/lib.rs:414)*

3. Accept OAuth on the desktop client and finish sign-in through the `/verify` bridge
   *(apps/dashboard/src/components/google-sign-in.tsx:17, apps/dashboard/src/components/desktop-sign-in-verify-code.tsx:16)*

4. Paste or trigger `zeke://` links (auth callbacks, checkout success, banking reconnect) to jump straight into the desired screen
   *(apps/desktop/src-tauri/src/lib.rs:362, apps/dashboard/src/app/api/checkout/success/route.ts:3)*

5. Manage the window chrome — hide, minimize, or toggle full-screen — using the app’s traffic-light controls
   *(apps/dashboard/src/components/desktop-traffic-light.tsx:14)*

6. Fire a global search result to open customers, invoices, tracker projects, or documents within the main window
   *(apps/dashboard/src/components/search/search.tsx:245)*

7. Kick off or resume bank connector flows marked for desktop, returning through `zeke://settings/accounts` or `/`
   *(apps/dashboard/src/app/api/enablebanking/session/route.ts:21, apps/dashboard/src/app/api/gocardless/reconnect/route.ts:25)*

8. Complete a billing checkout in the browser and re-enter the app through the `desktop/checkout/success` deep link
   *(apps/dashboard/src/app/api/checkout/success/route.ts:8)*

9. Open document downloads or external integration URLs via the system browser using desktop-aware helpers
   *(apps/dashboard/src/lib/download.ts:4, apps/dashboard/src/components/open-url.tsx:12)*

10. Use the tray menu to check for client updates and install them in-place
    *(apps/desktop/src-tauri/src/lib.rs:41, :578)*

## 13. Vault Document Management

1. **Route prefetch & filter hydration**
   `apps/dashboard/src/app/[locale]/(app)/(sidebar)/vault/page.tsx:1` unwraps `loadDocumentFilterParams(searchParams)` so server renders respect `q`, tags, and date filters before prefetching `trpc.documents.get.infiniteQueryOptions({ pageSize: 20 })`.
   The view wraps children in Suspense with `VaultSkeleton` so both grid (`VaultGridSkeleton`) and list (`DataTableSkeleton`) are ready for streaming states.

2. **Header wiring (search + controls)**
   `VaultHeader` (`apps/dashboard/src/components/vault/vault-header.tsx:1`) couples the AI-assisted search bar (`vault-search-filter.tsx:1`) with the view/actions cluster (`vault-actions.tsx:1`).
   The actions bar keeps upload shortcuts and view toggles desktop-only (`hidden md:flex`) while the search column spans mobile widths.

3. **AI-driven filter composer**
   `VaultSearchFilter` (`vault-search-filter.tsx:1`) binds `useDocumentFilterParams()` query-state, keyboard shortcuts (`meta+s`, `esc`), and fetches tag metadata on demand (`trpc.documentTags.get`).
   Multi-word queries stream partial filter suggestions via `generateVaultFilters` (OpenAI gpt-4o-mini, `apps/dashboard/src/actions/ai/filters/generate-vault-filters.ts:1`) and render chips through `FilterList` so users can clear date/tag scopes without losing the typed prompt.

4. **View/query state orchestration**
   `useDocumentParams()` (`apps/dashboard/src/hooks/use-document-params.ts:1`) centralises `documentId`, `filePath`, and `view` in the URL, letting `VaultViewSwitch` (`vault-view-switch.tsx:1`) flip between grid and list while `DocumentSheet` (`apps/dashboard/src/components/sheets/document-sheet.tsx:1`) listens for either ID or path to open the details sheet globally (`global-sheets.tsx:1`).

5. **Upload surface & hidden input**
   `VaultUploadZone` (`vault-upload-zone.tsx:1`) wraps the entire view with a `react-dropzone` drop target, exposes the hidden `<input id="upload-files">`, and tracks up to 25 files (≤5 MB each).
   It leverages resumable uploads (`apps/dashboard/src/utils/upload.ts:1`, tus 6 MB chunks) and live progress toasts (`useToast`) before queueing `trpc.documents.processDocument` mutations for each file batch.

6. **Processing pipeline & job fan-out**
   The documents router (`apps/api/src/trpc/routers/documents.ts:1`) partitions uploads into supported/unsupported mimetypes, marks unsupported rows `processingStatus: "completed"`, and batch triggers the `process-document` Trigger.dev task (`tasks.batchTrigger`) for OCR, summarisation, and embedding.
   Storage deletions and short-link generation share the same router, keeping all lifecycle mutations in sync.

7. **Grid rendering & realtime hydration**
   `VaultGrid` (`vault-grid.tsx:1`) streams documents via `useSuspenseInfiniteQuery`, debounces realtime INSERT/UPDATE events (`useRealtime`, `apps/dashboard/src/hooks/use-realtime.ts:1`), flattens pages with `useMemo`, and auto-fetches the next page when `LoadMore` hits the viewport (`useInView`).
   Empty results branch to `NoResults` or the FTUX hero (`VaultGetStarted`).

8. **Card UI, previews, and quick actions**
   `VaultItem` (`vault-item.tsx:1`) stitches together live previews (`FilePreview → /api/proxy//api/preview`), skeletons for pending HEIC conversions, tag chips (`vault-item-tags.tsx:1`), and hover-only `VaultItemActions` for download (`downloadFile`), 30-day share links (`trpc.shortLinks.createForDocument`), and deletes (cached invalidations for `documents.get` and `search.global`).

9. **Tagging & filter shortcuts**
   Clicking a chip in grid (`VaultItemTags`) or list (`columns.tsx:1`) sends `setFilter({ tags: [...] })`.
   Detail tagging flows reuse `VaultSelectTags` (`vault-select-tags.tsx:1`) which hydrate `trpc.documentTags.get`, create new tags (slugified + embedded, `document-tags.ts:1`), and call `trpc.documentTagAssignments.create/delete` (`document-tag-assignments.ts:1`) while keeping selector state in sync.

10. **List/table workspace & multi-select bar**
    `DataTable` (`data-table.tsx:1`) reuses the infinite query, row selection via Zustand (`apps/dashboard/src/store/vault.ts:1`), and sticky column scroll management (`useTableScroll`).
    Row metadata wires dropdown actions (view, download, copy link, delete) while `BottomBar` (`bottom-bar.tsx:1`) animates in for bulk downloads using `useDownloadZip` (`apps/dashboard/src/hooks/use-download-zip.ts:1`) which requests time-limited signed URLs (`documents.signedUrls`) and zips files client-side with JSZip before saving.

11. **Detail sheet & viewers**
    `DocumentDetails` (`apps/dashboard/src/components/document-details.tsx:1`) seeds initial cache from infinite pages, refetches live data, renders the dynamic `FileViewer` (`file-viewer.tsx:1`) for images/PDFs, exposes summary text, tags, and calls `DocumentActions` for download/share/delete.
    Closing the sheet clears `documentId/filePath` query params so upstream views stay consistent.

12. **Related documents carousel**
    When open in “full view” mode (ID present), `VaultRelatedFiles` (`vault-related-files.tsx:1`) fetches `trpc.documents.getRelatedDocuments` (KNN embeddings) and shows a horizontal carousel of contextually similar files, each reusing `VaultItem small` for quick previews without delete controls.

13. **Cross-module integrations**
    Widgets (`apps/dashboard/src/components/widgets/vault/vault.tsx:1`), transaction attachment pickers (`select-attachment.tsx:1`), inbox suggestions, and AI flows all call `useDocumentParams` to deep-link into `/vault`, open documents via the global sheet, or seed filters.
    Invalidations in `VaultGrid`/`DataTable` always include `trpc.search.global` so assistant/autocomplete surfaces stay fresh.

---

### Vault Actions

1. **Search documents by keyword** and hit enter to apply plain-text filters (`vault-search-filter.tsx:1`).

2. **Type natural-language prompts** (e.g., “contracts from Q4”) and let AI stream date/tag filters into place (`generate-vault-filters.ts:1`).

3. **Toggle between grid and list layouts** with the view switch or URL view param (`vault-view-switch.tsx:1`).

4. **Drag-and-drop up to 25 files** or click “Upload” to invoke the hidden file input and start resumable uploads (`vault-upload-zone.tsx:1`, `vault-upload-button.tsx:1`).

5. **Track upload progress via toasts**, then let background processing finish summaries/embeddings (`vault-upload-zone.tsx:1`, `documents.ts:1`).

6. **Open any document detail sheet** by clicking a card or table row, preview it inline, and close to return (`vault-item.tsx:1`, `data-table.tsx:1`, `document-details.tsx:1`).

7. **Download individual files instantly** or copy 30-day share links from either the hover toolbar or detail sheet (`vault-item-actions.tsx:1`, `document-actions.tsx:1`).

8. **Multi-select rows in list view**, clear selections, or bulk download a zipped archive of the chosen files (`bottom-bar.tsx:1`, `use-download-zip.ts:1`).

9. **Add, remove, or create tags** directly from the document sheet, with new tags auto-embedded for semantic search (`document-tags.tsx:1`, `vault-select-tags.tsx:1`).

10. **Click any tag chip** to jump into a filtered view of matching documents (`vault-item-tags.tsx:1`, `columns.tsx:1`).

11. **Clear all applied filters or specific chips** from the filter tray (`vault-search-filter.tsx:1`, `filter-list.tsx:1`).

12. **Browse AI-suggested “Related Files”** inside the document sheet and open adjacent documents without leaving context (`vault-related-files.tsx:1`).

13. **Trigger deletes** from grid/list/detail views to remove both the database row and storage object (`vault-item-actions.tsx:1`, `document-actions.tsx:1`, `documents.ts:1`).

14. **Launch the vault sheet from other surfaces** (transactions, inbox, widgets) to inspect or attach files without manually navigating to `/vault` (`global-sheets.tsx:1`, `select-attachment.tsx:1`, `widgets/vault/vault.tsx:1`).


## 14. # Event Stack

- **LogEvents** centralizes named/channel pairs for auth, banking, vault, inbox, and support events that other packages consume
  `packages/events/src/events.ts:1`.

- The **React provider** wraps both dashboard and marketing apps, wiring OpenPanel while limiting screen/outgoing link tracking to production builds
  `packages/events/src/client.tsx:9`
  `apps/dashboard/src/app/[locale]/layout.tsx:6`
  `apps/website/src/app/layout.tsx:9`.

- **Server helper `setupAnalytics`** checks the tracking-consent cookie before calling `identify`, then defers `track` calls via `waitUntil`; non-prod environments log to the console instead of OpenPanel
  `packages/events/src/server.ts:10`.

- **authActionClient** injects analytics into server actions and auto-fires any `metadata.track` payload after fetching the authenticated user
  `apps/dashboard/src/actions/safe-action.ts:42`.

- **API/webhook routes** call `setupAnalytics` directly when safe actions aren’t involved, keeping sign-in, registration, and inbox ingestion in the same telemetry channel
  `apps/dashboard/src/app/api/auth/callback/route.ts:41`
  `apps/dashboard/src/app/api/webhook/registered/route.ts:41`
  `apps/dashboard/src/app/api/webhook/inbox/route.ts:86`.


# Instrumented Actions

1. **Sign-in & onboarding** – OAuth callback records *User Signed In*, while the registration webhook logs *User Registered* before kicking off team onboarding
   `apps/dashboard/src/app/api/auth/callback/route.ts:41`
   `apps/dashboard/src/app/api/webhook/registered/route.ts:41`.

2. **Bank linking (Plaid/Teller)** – Client modal and Teller widget emit success/cancel events with provider context whenever a user authorizes or exits a link attempt
   `apps/dashboard/src/components/modals/connect-transactions-modal.tsx:148`
   `apps/dashboard/src/components/teller-connect.tsx:37`.

3. **Bank linking (EnableBanking/GoCardLess)** – Server actions fire `EnableBankingLinkCreated`/`Reconnected` at launch and `...Failed` on errors; GoCardLess captures agreement/link creation metadata plus failure paths
   `apps/dashboard/src/actions/institutions/create-enablebanking-link.ts:34`
   `apps/dashboard/src/actions/institutions/reconnect-enablebanking-link.ts:25`
   `apps/dashboard/src/actions/institutions/create-gocardless-link.ts:36`.

4. **Connection maintenance** – Manual syncs, reconnect flows, and transaction exports/imports all log their respective events via action metadata before delegating to Trigger.dev jobs
   `apps/dashboard/src/actions/transactions/manual-sync-transactions-action.ts:15`
   `apps/dashboard/src/actions/transactions/reconnect-connection-action.ts:16`
   `apps/dashboard/src/actions/export-transactions-action.ts:17`
   `apps/dashboard/src/actions/transactions/import-transactions.ts:26`.

5. **Security & feedback loops** – MFA verification, support requests, and feedback submissions automatically emit telemetry in tandem with Plain API calls
   `apps/dashboard/src/actions/mfa-verify-action.ts:16`
   `apps/dashboard/src/actions/send-support-action.tsx:37`
   `apps/dashboard/src/actions/send-feedback-action.ts:18`.

6. **Inbox ingestion** – The email webhook records each inbound message before processing attachments and triggering downstream notifications
   `apps/dashboard/src/app/api/webhook/inbox/route.ts:86`.


# Gaps & Notes

- Many declared events remain unused (*SignOut*, *ChangeTeam*, vault CRUD, currency updates, etc.), suggesting future coverage or cleanup work
  `packages/events/src/events.ts:6`.

- Because `track` short-circuits outside production, staging environments need production-like env vars if analytics validation is required
  `packages/events/src/client.tsx:21`.

- Consent only influences `identify`; anonymous events still fire when the cookie is absent, so downstream filtering may be necessary
  `packages/events/src/server.ts:14`.

- Direct `analytics.track` calls omit `channel`, whereas metadata-driven tracks include it; aligning payload shapes would make OpenPanel dashboards more consistent
  Compare:
  `apps/dashboard/src/actions/institutions/create-enablebanking-link.ts:34` vs
  `apps/dashboard/src/actions/send-support-action.tsx:39`.
