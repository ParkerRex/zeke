# Zeke - Project Architecture & Agent Documentation

## Project Structure

### Overview
This is a monorepo project using pnpm workspaces with TypeScript. Each app and package contains its own `.agents.md` file with specific implementation details and context for that module.

### Directory Tree

```
zeke/
├── apps/                    # Application packages
│   ├── api/                # Backend API service
│   ├── dashboard/          # Web dashboard application
│   ├── desktop/            # Desktop application
│   ├── engine/             # Core processing engine
│   └── website/            # Public website
│
├── packages/               # Shared packages
│   ├── cache/             # Caching utilities
│   ├── categories/        # Category management
│   ├── db/                # Database schema and migrations
│   ├── desktop-client/    # Desktop client SDK
│   ├── documents/         # Document handling
│   ├── email/             # Email services
│   ├── encryption/        # Encryption utilities
│   ├── engine-client/     # Engine client SDK
│   ├── events/            # Event system
│   ├── import/            # Import utilities
│   ├── inbox/             # Inbox management
│   ├── invoice/           # Invoice processing
│   ├── jobs/              # Job queue system
│   ├── location/          # Location services
│   ├── logger/            # Logging utilities
│   ├── notifications/     # Notification system
│   ├── supabase/          # Supabase client and types
│   ├── tsconfig/          # Shared TypeScript configurations
│   ├── ui/                # Shared UI components
│   └── utils/             # Common utilities
│
├── docs/                   # Documentation
├── types/                  # Shared TypeScript types
├── .github/               # GitHub Actions workflows
└── .vscode/               # VS Code workspace settings
```

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
Drizzle lives in the `@zeke/db` package. The CLI is configured in `packages/db/drizzle.config.ts:1`, which points the generator at the schema file and reads the connection string from `DATABASE_SESSION_POOLER` (see `apps/api/.env-template:11` for the expected env vars).

### Drizzle Migration Flow

1. **Update Schema**: Update or add your tables in `packages/db/src/schema.ts` so the ORM reflects the structure you want.

2. **Export Connection String**: Export the connection string you want to target (local Postgres or the Supabase session pooler) to `DATABASE_SESSION_POOLER`:
   ```bash
   export DATABASE_SESSION_POOLER="postgresql://..."
   ```

3. **Generate Migration**: From the repo root run:
   ```bash
   bunx drizzle-kit generate:pg --config packages/db/drizzle.config.ts
   ```
   This writes a timestamped SQL file under `packages/db/migrations/`; add that file to git.

4. **Apply Migration**: To apply the migration to whichever database the env var points to, run:
   ```bash
   bunx drizzle-kit push:pg --config packages/db/drizzle.config.ts
   ```
   Repeat the command with the local connection string for your local stack, then with the Supabase pooler string for the hosted database.

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