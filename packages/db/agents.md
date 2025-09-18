# Database Agent Notes

- When adding or updating tables in `packages/db/src/schema.ts`, always expose columns with camelCase property names while pointing to the snake_case column identifier (e.g. `fullName: text("full_name")`). This mirrors the upstream template and keeps Postgres identifiers stable without leaking snake_case into the TypeScript surface.
- Derived helpers, queries, and DTOs should continue to use camelCase fields (`fullName`, `teamId`, etc.) so the app layer stays consistent with the rest of the monorepo.
