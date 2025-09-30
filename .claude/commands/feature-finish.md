---
name: feature-finish
argument-hint: "[plan-path]"
description: Finalize feature implementation - validate completion, run tests, update changelog, and archive
allowed-tools: Read, Write, Edit, Bash, Glob
---

You are an expert release engineer responsible for finalizing feature implementations. You will validate that all work is complete, ensure quality standards are met, update documentation, and archive the completed feature.

**CRITICAL**: Throughout this entire process, you must use actual current dates from the system. Never use placeholder dates like YYYY-MM-DD or YYYYMMDD. Always execute commands like `date +%Y-%m-%d` or `date +%Y%m%d` to get real timestamps for changelogs, archives, and documentation.

<plan_file_path>
{{PLAN_FILE_PATH}}
</plan_file_path>

Your task is to process this implementation plan file and guide the feature through final validation and archival. Follow these steps precisely:

## Step 1: Analyze Todo Status

First, read the plan file from the provided path. If the file doesn't exist, output "❌ Plan file not found: [path]. Please check the path and try again." and stop.

Extract the feature identifier from the file path (the folder name containing the plan file).

Analyze the plan content:
- Count total tasks (lines starting with `- [ ]` or `- [x]`)
- Count completed tasks (lines with `- [x]`)
- List any uncompleted tasks (lines with `- [ ]`)

If uncompleted tasks exist:
- Output: "⚠️ Found X uncompleted tasks: [list them]. Do you want to proceed anyway? (yes/no)"
- Wait for user response
- If "no": Output "❌ Aborting. Please complete remaining tasks or run `/feature-implement [plan-path]`" and stop
- If "yes": Continue to next step

If all tasks are complete, continue to Step 2.

## Step 2: Validate Git Changes

Execute these git commands to understand the current state:
```bash
git status --porcelain
git diff --cached --stat
git diff --stat
```

Analyze the output and provide a summary:
```
📝 Git Status Summary
=====================
Staged files: X
Unstaged files: Y
Total changed files: Z

Key changes:
- [List main files/components modified]
```

If no changes are detected, output: "⚠️ No git changes detected. Was the work committed already?"

## Step 3: Quality Assurance

### Detect Available Commands
Check package.json for these script types:
- Test commands: `test`, `test:unit`, `test:integration`
- Typecheck commands: `typecheck`, `tsc`, `type-check`
- Lint commands: `lint`, `eslint`

### Run Quality Checks
For each available command type, execute in this order:

1. **TypeScript Checking** (if available):
   - Run: `pnpm run typecheck || npm run typecheck || yarn typecheck`
   - If errors occur, attempt to fix automatically and re-run (max 3 attempts)

2. **Tests** (if available):
   - Run: `pnpm test || npm test || yarn test`
   - If failures occur, analyze and attempt fixes, then re-run (max 3 attempts)

3. **Linting** (if available):
   - Run: `pnpm run lint || npm run lint || yarn lint`
   - If failures occur, try with --fix flag and re-run

Output results:
```
✅ Quality Checks
=================
TypeScript: [PASS/FAIL/SKIPPED]
Tests: [PASS/FAIL/SKIPPED]
Linting: [PASS/FAIL/SKIPPED]
```

If any checks fail after maximum attempts, ask: "⚠️ Quality checks failed. Do you want to proceed anyway? (yes/no)"

## Step 4: Changelog Update (Interactive)

### Generate Changelog Entry
Extract from the plan file:
- Feature identifier
- Feature description (from Executive Summary or similar section)
- Key implemented functionality (from completed tasks)

Get the actual current date by running: `date +%Y-%m-%d`

Create a changelog entry draft using the real current date:
```markdown
## [Unreleased] - [actual current date]

### Added
- **[Feature Name]**: [Brief description]
  - [Key functionality point 1]
  - [Key functionality point 2]
  - [Key functionality point 3]
```

### Request User Confirmation
Present the draft:
```
📝 Proposed CHANGELOG.md Entry
================================
[Show the complete draft entry]

Would you like to update CHANGELOG.md with this entry? (yes/no)
```

### Process Response
- If "yes": Read existing CHANGELOG.md (create if missing), add the entry at the top, save the file, output: "✅ Updated CHANGELOG.md with feature: [feature-name]"
- If "no": Output: "⏭️ Skipping changelog update"

## Step 5: Git Pull Request (Interactive)

### Prepare for PR
Check for uncommitted changes with `git status --porcelain`. If found:
1. Stage all: `git add .`
2. Commit with: `git commit -m "feat([identifier]): [feature description]"`

### Generate PR Description
Create a comprehensive description:
```markdown
## Summary
[Brief feature description]

## Changes
- ✅ [Major change 1]
- ✅ [Major change 2]
- ✅ [Major change 3]

## Testing
- TypeScript: [status from Step 3]
- Tests: [status from Step 3]
- Linting: [status from Step 3]

## Tasks Completed
[List completed tasks from plan]

## Related Documents
- Tech Spec: `.agents/features/[identifier]/[identifier]-tech-spec.md`
- Implementation Plan: `.agents/features/[identifier]/[identifier]-plan.md`
```

### Request PR Confirmation
```
🔀 Pull Request Details
========================
Title: feat([identifier]): [feature description]
Base Branch: main
Description:
[Show complete PR description]

Would you like to create a pull request? (yes/no)
```

### Create Pull Request
If "yes":
1. Create branch if needed: `git checkout -b feature/[identifier]`
2. Push: `git push -u origin feature/[identifier]`
3. Create PR: `gh pr create --title "feat([identifier]): [description]" --body "[PR description]" --base main`
4. Output: "✅ Pull request created: [PR_URL]"

If "no": Output: "⏭️ Skipping pull request creation"

If GitHub CLI fails, provide manual instructions.

## Step 6: Archive Feature (Interactive)

### Request Archive Confirmation
Get current date in YYYYMMDD format: `date +%Y%m%d`

Ask:
```
📦 Archive Feature
==================
Would you like to archive the feature documentation to .agents/features/shipped/? (yes/no)

This will move:
FROM: .agents/features/[identifier]/
TO:   .agents/features/shipped/[identifier]-[actual current date in YYYYMMDD]/
```

### Process Archive Response
If "yes":
1. Create directory: `mkdir -p .agents/features/shipped/`
2. Get current date: `DATE=$(date +%Y%m%d)`
3. Move folder: `mv .agents/features/[identifier] .agents/features/shipped/[identifier]-$DATE`
4. Verify: `ls -la .agents/features/shipped/[identifier]-$DATE/`
5. Output: "✅ Feature archived to: `.agents/features/shipped/[identifier]-[actual date]/`"

If "no": Output: "⏭️ Feature documentation remains in: `.agents/features/[identifier]/`"

## Final Output

Provide this comprehensive summary:
```
🎉 Feature Finalization Summary
================================

📊 Implementation Status
------------------------
✅ Tasks completed: X/Y
📝 Files changed: Z
✅ Quality checks: [PASSED/PARTIAL/FAILED]

📚 Actions Taken
----------------
[✅/⏭️] CHANGELOG.md: [Updated/Skipped]
[✅/⏭️] Pull Request: [Created - URL/Skipped]
[✅/⏭️] Feature Archive: [Moved to shipped/Kept in features]

🚀 Remaining Steps (if any)
---------------------------
[List manual steps for anything skipped]

👏 Great work on completing the [feature-name] feature!
```

## Error Handling Rules

- If plan file not found: Stop with error message
- If not in git repository: Output "❌ Not in a git repository. Please initialize git first."
- If commands not found: Skip with informational message
- If file permissions prevent updates: Provide clear error message
- Always ask user confirmation before proceeding past failures
- Use actual system dates, never placeholders

Begin by reading the plan file and analyzing the completion status. Remember to use real dates from the system throughout the entire process.