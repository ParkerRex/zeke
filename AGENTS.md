# Zeke - Project Architecture & Agent Documentation

## Project Structure

### Overview
This is a monorepo project using pnpm workspaces with TypeScript. Each app and package contains its own `.agents.md` file with specific implementation details and context for that module.

## Agent Documentation

Each app and package directory contains its own `.agents.md` file that provides:
- Module-specific context and purpose
- Key implementation details
- API endpoints or exported functions
- Dependencies and relationships
- Testing approach
- Common tasks and workflows

When working with a specific module, always check its `.agents.md` file first for detailed context.

## Database

### Overview
The project uses Drizzle ORM with PostgreSQL (via Supabase) for data persistence.

### Drizzle Configuration
### Supabase Type Generation

1. **Install & Authenticate**: Install and authenticate the Supabase CLI (`supabase login`) if you haven't already.

2. **Set Project ID**: Set `PROJECT_ID` to your Supabase project id (the CLI uses it in the script defined at `packages/supabase/package.json:9`).

3. **Generate Types**: From `packages/supabase`, run:
   ```bash
   bun run db:generate
   ```
   This executes `supabase gen types --lang=typescript --project-id $PROJECT_ID --schema public` and overwrites `packages/supabase/src/types/db.ts`, which is the typed client used throughout the monorepo. Commit the regenerated file along with your migration.

### Post-Migration Steps
After finishing you'll usually want to:
- Re-run any affected services (API, dashboard, etc.) so they pick up the new tables
- Keep an eye on `packages/db/src/schema.ts` and `packages/supabase/src/types/db.ts` in your diff before committing

## Development Setup

For detailed setup instructions, environment variables, and development workflows, refer to:
- Root `README.md` for general setup
- Individual app/package `.agents.md` files for module-specific setup
- `apps/api/.env-template` for required environment variables

## Key Technologies

- **Runtime**: Node.js with Bun/pnpm
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle
- **Monorepo**: pnpm workspaces
- **Build**: Turbo