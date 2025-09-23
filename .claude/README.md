# Claude Commands Documentation

## Best Practices

### Command Usage Guidelines

1. **Use descriptive identifiers**: When commands ask for 3-word identifiers, make them meaningful (e.g., "user-auth-system" not "thing-one-two")

2. **Provide complete context**: Include all relevant details in your descriptions - the AI needs context to generate accurate specifications

3. **Follow the workflow**: Commands are designed to work in sequence - don't skip steps

4. **Check outputs**: Always review generated files before proceeding to the next step

5. **Keep artifacts organized**: All generated files are stored in `.agents/` subdirectories for easy tracking

### File Organization

All Claude command artifacts are stored in `.agents/` with this structure:
```
.agents/
├── features/          # New feature development
│   └── [identifier]/  # Each feature gets its own folder
├── debugging/         # Bug fixes and RCA
│   └── [identifier]/  # Each bug gets its own folder
└── ...
```

---

## Feature Development Commands

### Complete Feature Development Workflow

Build new features systematically from specification to implementation.

#### `/feature-spec` - Generate Technical Specification
Creates a comprehensive technical product requirements document for a new feature.

**Usage:**
```
/feature-spec "Detailed description of the feature including user needs, business goals, and high-level requirements"
```

**Output:**
- Creates directory: `.agents/features/[3-word-identifier]/`
- Generates: `[identifier]-tech-spec.md` with complete technical PRD

**Example:**
```
/feature-spec "We need a user authentication system that supports email/password login, OAuth with Google and GitHub, password reset via email, and session management with JWT tokens. Should include rate limiting and account lockout after failed attempts."
```
Creates: `.agents/features/user-auth-system/user-auth-system-tech-spec.md`

#### `/feature-plan` - Generate Implementation Plan
Takes the tech spec and generates an actionable implementation plan.

**Usage:**
```
/feature-plan ".agents/features/[identifier]/[identifier]-tech-spec.md"
```

**Output:**
- Creates: `[identifier]-plan.md` with atomic, executable tasks
- Each task is independently completable (1-4 hours of work)
- Tasks are organized into logical phases
- Includes acceptance criteria and dependencies

#### `/feature-implement` - Execute Implementation Plan
Executes the implementation plan tasks systematically.

**Usage:**
```
/feature-implement ".agents/features/[identifier]/[identifier]-plan.md"
```

**Options:**
```
/feature-implement ".agents/features/[identifier]/[identifier]-plan.md" true
```
- Standard mode (default): Asks for confirmation after each task
- Accept-edits mode (pass `true`): Auto-executes up to 10 tasks

**Features:**
- Executes tasks in order with dependency checking
- One retry on failure before asking for help
- Updates plan file with completion status and timestamps
- Provides execution summary at the end

### Complete Feature Development Workflow Example

1. **Generate the technical specification:**
   ```
   /feature-spec "Build a notification system that supports email, SMS, and in-app notifications. Users should be able to configure preferences per notification type. Include templating support and delivery tracking."
   ```
   Creates: `.agents/features/notification-delivery-system/notification-delivery-system-tech-spec.md`

2. **Create the implementation plan:**
   ```
   /feature-plan ".agents/features/notification-delivery-system/notification-delivery-system-tech-spec.md"
   ```
   Creates: `.agents/features/notification-delivery-system/notification-delivery-system-plan.md`

3. **Execute the implementation:**
   ```
   /feature-implement ".agents/features/notification-delivery-system/notification-delivery-system-plan.md"
   ```
   Or for batch mode:
   ```
   /feature-implement ".agents/features/notification-delivery-system/notification-delivery-system-plan.md" true
   ```

### Feature Development Tips

- **Start with clear requirements**: The better your initial description, the more accurate the tech spec
- **Review before proceeding**: Check the tech spec before generating the plan
- **Track progress**: Implementation tasks are marked complete in the plan file
- **Handle blockers**: If implementation fails, the system will retry once then ask for guidance
- **Use batch mode wisely**: Only use accept-edits mode when you're confident in the plan

---

## Debugging Commands

### Systematic Bug Analysis and Resolution

Fix bugs methodically with root cause analysis and structured implementation.

#### `/debug-rca` - Root Cause Analysis
Performs comprehensive root cause analysis on a bug or incident.

**Usage:**
```
/debug-rca "Full problem description" "3-word-bug-identifier"
```

**Arguments:**
- Problem report: Complete details of the issue, symptoms, timeline
- Bug identifier: 3-word hyphenated description (e.g., "auth-token-expiry")

**Output:**
Creates: `.agents/debugging/[identifier]/[identifier]-rca.md`

**Example:**
```
/debug-rca "Users are experiencing intermittent login failures. The system returns 'Invalid token' errors after successful authentication. This started happening after the last deployment on Friday. Error logs show token validation failures despite tokens being recently issued." "auth-token-expiry"
```

#### `/debug-implement` - Implementation Plan & Fixes
Creates an implementation plan from RCA and executes fixes.

**Usage:**
```
/debug-implement "[RCA document content]"
```

**Output:**
- Creates: `.agents/debugging/[identifier]/[identifier]-plan.md`
- Executes fixes based on the plan

### Debugging Workflow Example

1. **Analyze the bug:**
   ```
   /debug-rca "Detailed bug description..." "database-connection-timeout"
   ```

2. **Implement fixes:**
   ```
   /debug-implement "[paste RCA content]"
   ```

### RCA Document Contents

The root cause analysis includes:
- Event sequence diagram
- Multi-angle analysis (technical, operational, environmental, monitoring)
- Root cause identification
- Impact assessment
- Prevention recommendations
- Lessons learned

---

## Command Development

### Creating New Commands

To create a new Claude command:

1. **Create command file**: `.claude/commands/[command-name].md`

2. **Add frontmatter:**
   ```yaml
   ---
   name: command-name
   description: Brief description of what the command does
   args:
     arg1:
       type: string
       description: What this argument is for
       required: true
   ---
   ```

3. **Write the prompt**: Include clear instructions for the AI

4. **Test thoroughly**: Ensure outputs are consistent and useful

### Command Best Practices

- **Single responsibility**: Each command should do one thing well
- **Clear outputs**: Specify exactly what files/artifacts to create
- **Error handling**: Include retry logic and failure modes
- **Progress tracking**: Update files to show completion status
- **User feedback**: Provide clear status messages

---

## Troubleshooting

### Common Issues

**Files not created in expected location:**
- Check that the `.agents/` directory exists
- Verify the identifier format (lowercase, hyphens)

**Commands not recognized:**
- Ensure command file has proper frontmatter
- Check command name matches filename

**Incomplete execution:**
- Review error messages for specific failures
- Check dependencies are met (e.g., tech spec exists before planning)

### Getting Help

If you encounter issues:
1. Check the command output for error messages
2. Verify input format matches examples
3. Review generated files for completeness
4. Ask for clarification on specific steps