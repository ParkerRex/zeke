# VS Code Workspaces

Switch between different focused development environments based on what you're working on.

## Available Workspaces

### 🚀 Main App (`main-app.code-workspace`)
**Focus**: Frontend development on the main Next.js application
**Includes**: 
- `apps/app` - Main application
- `packages/supabase` - Database layer
- `packages/design-system` - UI components
- `packages/auth` - Authentication
- `packages/analytics` - Analytics

**Use when**: Building features, fixing bugs, frontend development

```bash
code workspaces/main-app.code-workspace
```

### 🌐 Marketing Site (`marketing-site.code-workspace`)
**Focus**: Marketing website development
**Includes**:
- `apps/web` - Marketing site
- `packages/cms` - Content management
- `packages/design-system` - UI components
- `packages/email` - Email templates
- `packages/auth` - Authentication

**Use when**: Working on marketing pages, blog, landing pages

```bash
code workspaces/marketing-site.code-workspace
```

### ⚙️ Worker (`worker.code-workspace`)
**Focus**: Background job processing and data pipeline
**Includes**:
- `apps/worker` - Background worker
- `packages/supabase` - Database layer
- `packages/auth` - Authentication
- `packages/observability` - Monitoring
- `packages/security` - Security tools

**Use when**: Working on data ingestion, job processing, backend logic

```bash
code workspaces/worker.code-workspace
```

### 🌍 Full Stack (`full-stack.code-workspace`)
**Focus**: Everything visible for complex cross-cutting work
**Includes**: All apps and core packages

**Use when**: Major refactoring, architecture changes, debugging across services

```bash
code workspaces/full-stack.code-workspace
```

## How It Works

Each workspace:
- **Shows only relevant folders** in the file explorer
- **Excludes irrelevant directories** from search
- **Sets appropriate terminal working directory**
- **Includes relevant tasks** for that workspace
- **Optimizes IDE performance** by reducing indexed files

## Quick Switch

```bash
# Main app development
code workspaces/main-app.code-workspace

# Marketing site work
code workspaces/marketing-site.code-workspace

# Backend/worker development  
code workspaces/worker.code-workspace

# Full monorepo access
code workspaces/full-stack.code-workspace
```

## Benefits

- **Faster IDE performance** - Less files to index
- **Reduced clutter** - Only see what you need
- **Focused development** - Less distractions
- **Relevant tasks** - Only see tasks for current work
- **Better search** - Search only in relevant code

## Customization

Edit any `.code-workspace` file to:
- Add/remove folders
- Adjust file exclusions
- Modify tasks
- Change settings

The workspace files are just JSON, so customize them for your workflow!
