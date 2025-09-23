# Format and Content Guidelines

- **Follow the Midday AGENTS doc structure**: Each orientation doc must use the canonical section order and headings, but every recommendation should explicitly reference Zeke’s roadmap in `docs/plans/in-progress/mapping-plan.md`.
- **Zeke Canonical Nouns**: Use Zeke’s primitives throughout:
  - **Sources** (ingest + raw_items)
  - **Stories** (narratives)
  - **Insights/Highlights** (analytic units)
  - **Briefs** (reports)
  - **Playbooks** (automation)
- **Naming and Migration**:
  - Align all naming and concepts with Zeke’s nouns.
  - Reuse Midday patterns only where they do not assume finance-specific logic.
  - Every ingest path must flow into an Insight.
  - Automate repeatable flows via Playbooks.
  - Only reference legacy finance terms to flag remaining technical debt.

## Required Output Structure

1. **Title**: `# {{Scope}} Agent Orientation`
2. **## Coding Preferences**: Detail how engineers should refactor Midday-era code to Zeke primitives (e.g., replace transaction imports with source ingestion, wire Trigger.dev jobs into Playbooks, use highlights instead of transactions, prefer shared UI primitives, enforce strict TypeScript + Zod validation).
3. **## Structure Overview**: Provide a fenced directory tree for the scope, annotate any files still tied to Midday logic, and specify the Zeke target (Sources, Insights, Briefs, Playbooks, governance).
4. **## Zeke Mapping Priorities**: Summarize the mapping-plan crosswalk for this scope, including:
    - Import Modal → Source Intake
    - Magic Inbox → Source Inbox
    - Vault → Source Library
    - Transactions → Insights/Highlights
    - Reports → Briefs
    - AI Assistant & Filters → Insight Assistant
    - Ingestion Workflows → Playbooks
    - Matching Engine → Source↔Insight Linking
    - Team & Access Patterns → Multi-tenant Source Governance
   For each, explain what this package/app must do to satisfy the mapping.
5. **## Immediate Migration Focus**: List concrete next actions (schema updates, refactors, Playbook hooks, RLS audits, UX copy changes) in Zeke terms.
6. **Optional Subsections**: Add `### Assistant Hooks`, `### Playbook Touchpoints`, or `### Governance Notes` as needed to clarify how Sources → Insights → Briefs connect for this surface.

## Writing Cues

- Call out any Trigger.dev jobs, Supabase schemas, or UI flows that still reference transactions/bank accounts, and describe the Zeke-aligned target state.
- Reference the relevant migration phases (Foundations, Source Experience, Insight Lifecycle, Briefs & Narratives, Playbooks & Automation, Polish & Governance) for this scope.
- Use a crisp, authoritative tone. Make the doc self-contained so an engineer can orient without reopening the mapping plan.