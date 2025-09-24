# Claude Command Chains

## Quick Start

```
┌─────────────────────────────────────────────────────────────┐
│                     🐛 DEBUG CHAIN                          │
├─────────────────────────────────────────────────────────────┤
│  /debug-rca "problem description" "bug-name"               │
│     ↓                                                       │
│  Creates: .agents/debugging/[bug-name]/[bug-name]-rca.md   │
│     ↓                                                       │
│  /debug-solution .../[bug-name]-rca.md                     │
│     ↓                                                       │
│  Creates: .agents/debugging/[bug-name]/[bug-name]-solution.md│
│     ↓                                                       │
│  /debug-implement .../[bug-name]-solution.md               │
│     ↓                                                       │
│  Creates plan & implements fixes                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ✨ NEW FEATURE CHAIN                     │
├─────────────────────────────────────────────────────────────┤
│  /feature-spec "feature description"                       │
│     ↓                                                       │
│  Creates: .agents/features/[name]/[name]-tech-spec.md      │
│     ↓                                                       │
│  /feature-plan .agents/features/[name]/[name]-tech-spec.md │
│     ↓                                                       │
│  Creates: .agents/features/[name]/[name]-plan.md           │
│     ↓                                                       │
│  /feature-implement .agents/features/[name]/[name]-plan.md │
│     ↓                                                       │
│  Implements the feature following the plan                 │
│     ↓                                                       │
│  /feature-finish .agents/features/[name]/[name]-plan.md    │
│     ↓                                                       │
│  Validates, tests, updates changelog, creates PR & archives│
└─────────────────────────────────────────────────────────────┘
```

## Debug Chain

The debug chain helps you systematically analyze and fix complex issues through root cause analysis:

1. **`/debug-rca`** - Performs root cause analysis
   - Requires: problem description + bug name (e.g., "auth-token-expiry")
   - Creates event sequence diagram
   - Multi-angle analysis (technical, operational, environmental, monitoring)
   - Identifies root causes and contributing factors
   - Output: `.agents/debugging/[bug-name]/[bug-name]-rca.md`

2. **`/debug-solution`** - Designs technical solution architecture
   - Reads the RCA document
   - Creates comprehensive solution architecture
   - Includes integration plans and risk assessment
   - Output: `.agents/debugging/[bug-name]/[bug-name]-solution.md`

3. **`/debug-implement`** - Creates plan and implements fixes
   - Reads solution/RCA document
   - Creates implementation plan with phases
   - Executes fixes systematically
   - Updates plan with completion status
   - Output: `.agents/debugging/[bug-name]/[bug-name]-plan.md`

## New Feature Chain

The feature chain guides you through planning and implementing new features:

1. **`/feature-spec`** - Creates technical specification
   - Analyzes existing tech stack (package.json, etc.)
   - Generates comprehensive PRD aligned with current codebase
   - Output: `.agents/features/[name]/[name]-tech-spec.md`

2. **`/feature-plan`** - Creates implementation plan
   - Breaks down spec into atomic tasks (1-4 hours each)
   - Organizes tasks by phases and dependencies
   - Output: `.agents/features/[name]/[name]-plan.md`

3. **`/feature-implement`** - Executes the plan
   - Works through tasks systematically
   - Optional batch mode: Add `true` for parallel execution
   - Input: Path to plan.md file

4. **`/feature-finish`** - Finalizes and ships the feature
   - Verifies all tasks are complete
   - Runs tests and typechecks until they pass
   - Asks if you want to update CHANGELOG.md (shows draft first)
   - Asks if you want to create a GitHub PR (shows PR message)
   - Asks if you want to archive to `.agents/features/shipped/`
   - Input: Path to plan.md file

## Directory Structure

```
.agents/
├── debugging/
│   └── [bug-name]/
│       ├── [bug-name]-rca.md      # Root cause analysis
│       ├── [bug-name]-solution.md # Solution architecture
│       └── [bug-name]-plan.md     # Implementation plan
├── features/
│   └── [feature-name]/
│       ├── [feature-name]-tech-spec.md
│       └── [feature-name]-plan.md
└── features/shipped/              # Completed features
    └── [feature-name]-[date]/
        ├── [feature-name]-tech-spec.md
        └── [feature-name]-plan.md
```

## Examples

### Debug Chain Example
```bash
# 1. Analyze the root cause
/debug-rca "Users getting 401 errors after login" "auth-token-expiry"

# 2. Design the solution
/debug-solution .agents/debugging/auth-token-expiry/auth-token-expiry-rca.md

# 3. Implement the fixes
/debug-implement .agents/debugging/auth-token-expiry/auth-token-expiry-solution.md
```

### Feature Chain Example
```bash
# 1. Create technical specification
/feature-spec "Add user notification system with email and SMS"

# 2. Generate implementation plan
/feature-plan .agents/features/user-notification/user-notification-tech-spec.md

# 3. Execute the implementation
/feature-implement .agents/features/user-notification/user-notification-plan.md

# 4. Finalize and ship the feature
/feature-finish .agents/features/user-notification/user-notification-plan.md
# This will:
# - Check all tasks are done
# - Run tests until they pass
# - Ask if you want to update CHANGELOG
# - Ask if you want to create a PR
# - Ask if you want to archive the docs
```

## Tips

- Feature specs automatically detect and use your existing tech stack
- Debug RCA includes multi-angle analysis for comprehensive understanding
- All commands create traceable documentation for your decisions
- Use batch mode in feature-implement for faster execution: `/feature-implement [path] true`
- Bug names should be descriptive 2-word identifiers (e.g., "auth-token", "memory-leak")