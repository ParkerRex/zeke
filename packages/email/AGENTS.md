# Email Package

## Coding Preferences

- Structure every template as a typed, defaulted React function wrapped in EmailThemeProvider so previews, dark mode, and inline styles all stay consistent.
- Always lean on getEmailThemeClasses + getEmailInlineStyles (and the shared Button, Logo, Footer) instead of ad-hoc class names; keep Tailwind usage to client-safe tokens only.
- Prefer @react-email/components primitives for layout and typography, back them with inline styles for legacy clients, and avoid CSS features that table-based clients strip.
- Source URLs through getAppUrl / getEmailUrl, keep CTAs as real <Button>s with absolute links, and reuse existing sections (Footer, GetStarted, etc.) before introducing new markup.
- Park human-readable strings inside locales/translations.ts; add keys with dot-notation, pass dynamic params through getI18n, and fall back gracefully when data is missing.
- Normalize and guard incoming data (names, dates, currency) prior to render; use date-fns helpers for formatting and keep security-sensitive copy (API keys, billing) crisp and actionable.

## Layout Guide

```
packages/email/
├── package.json               # Package metadata, workspace exports, scripts, and deps
├── tsconfig.json              # TypeScript config aligned with React Email tooling
├── vercel.json                # Vercel deployment regions/settings for previews
├── render.ts                  # Temporary render helper using react-dom/server
├── components/                # Shared UI primitives and theme utilities
│   ├── button.tsx             # Theme-aware wrapper around @react-email Button
│   ├── column.tsx             # Two-column feature block with image/text pairing
│   ├── footer.tsx             # Marketing footer with feature/resource link lists
│   ├── get-started.tsx        # Reusable CTA section pointing to onboarding link
│   ├── logo-footer.tsx        # Footer logo with dark-mode-safe filtering
│   ├── logo.tsx               # Header logo component with dark-mode CSS overrides
│   └── theme.tsx              # Theme provider, dark-mode CSS, inline style helpers
├── emails/                    # Individual transactional and lifecycle templates
│   ├── api-key-created.tsx    # Security alert when a team API key is generated
│   ├── app-installed.tsx      # Notification when an integration is added to a team
│   ├── app-review-request.tsx # Internal notice summarizing an app review submission
│   ├── connection-expire.tsx  # Warns that a bank connection will expire soon
│   ├── connection-issue.tsx   # Alerts about failed bank syncs and recovery steps
│   ├── get-started.tsx        # Onboarding follow-up guiding first actions
│   ├── invite.tsx             # Team invitation with join link and safety copy
│   ├── invoice-overdue.tsx    # Reminder that an invoice is past due
│   ├── invoice-paid.tsx       # Confirmation that an invoice payment was received
│   ├── invoice-reminder.tsx   # Gentle nudge before invoice payment is due
│   ├── invoice.tsx            # Base invoice delivery email with CTA button
│   ├── transactions.tsx       # Digest of recent transactions with localized strings
│   ├── trial-ended.tsx        # Message when a customer's trial has finished
│   ├── trial-expiring.tsx     # Heads-up that a trial is nearing expiration
│   └── welcome.tsx            # Welcome email introducing key product value props
├── locales/                   # Lightweight i18n plumbing for email copy
│   ├── index.ts               # Locale helper exposing a translation lookup (`t`)
│   └── translations.ts        # Static English/Swedish copy with parameter support
└── public/                    # Static assets served via `getEmailUrl` (e.g. logos)
```

**Conventions**: new templates live under `emails/`, reuse `components/` primitives, and remember to wire fresh copy through `locales` before exporting the template.