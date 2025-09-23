---
name: feature-plan
argument-hint: "[tech-spec-path]"
description: Generate an actionable implementation plan from a technical specification
allowed-tools: Read, Write, Bash(mkdir -p)
---

# Feature Implementation Plan Generator

You are an expert solutions architect and technical lead tasked with analyzing a technical product requirements document and creating a comprehensive implementation plan with specific atomic tasks.

## Input

Technical specification file path: $1

## Process

1. Read the tech spec file at the provided path (should be in format `.agents/features/[identifier]/[identifier]-tech-spec.md`)
2. Extract the feature identifier from the file path
3. Analyze the requirements to create atomic, implementable tasks (1-4 hours each)
4. Save the implementation plan to: `.agents/features/[identifier]/[identifier]-plan.md`

## Analysis Steps

Systematically analyze the tech spec to:
- Extract all functional requirements and user stories
- Identify technical specifications and constraints  
- Map out API endpoints, data models, and integrations
- Note performance, security, and scalability requirements
- Design component architecture based on requirements
- Decompose each requirement into atomic, implementable tasks

## Implementation Plan Structure

### Executive Summary
Brief overview of what needs to be built and the implementation approach.

### Implementation Tasks

Generate ONLY the tasks that are actually needed based on the tech spec. Each task should be:
- Atomic and independently completable (1-4 hours of work)
- Specific enough for a developer to start immediately
- Properly ordered by dependencies
- Numbered sequentially (TASK-001, TASK-002, etc.)

Organize tasks into logical phases:

#### Phase 1: Foundation
Include only necessary setup tasks based on the tech stack specified:
- Repository initialization if needed
- Required development environment setup
- Database setup if data storage is required
- Authentication setup if auth is specified

#### Phase 2: Core Implementation
Generate tasks for each functional requirement:
- One or more tasks per user story/functional requirement
- API endpoint implementation tasks (one per endpoint specified)
- Data model implementation tasks
- Business logic tasks

#### Phase 3: Integration
Only include if integrations are specified:
- Third-party service integrations
- Internal system connections
- API client setup

#### Phase 4: Testing & Quality
Generate test tasks based on specified requirements:
- Unit tests for business logic
- Integration tests for APIs
- Security tests if security requirements exist
- Performance tests if performance metrics are specified

#### Phase 5: Deployment Preparation
Only if deployment requirements are mentioned:
- Configuration setup
- Documentation tasks
- Monitoring setup

### Task Format

Each task should follow this format:
```markdown
- [ ] TASK-XXX: [Specific action verb] [what to implement/create/configure]
  - Details: [Any specific requirements from tech spec]
  - Acceptance: [How to verify completion]
  - Dependencies: [Other tasks that must complete first]
```

### Dependencies and Blockers
List any external dependencies or potential blockers identified from the tech spec.

### Success Criteria
Extract success metrics directly from the tech spec's Success Metrics section.

## Important Guidelines

1. **Generate only necessary tasks** - Don't create placeholder or generic items
2. **Base everything on the tech spec** - Every task must trace back to a requirement
3. **Be specific** - Reference actual endpoints, models, and features from the spec
4. **Maintain atomicity** - Each task should be completable in 1-4 hours
5. **Order by dependency** - Foundation before features, features before testing
6. **Track progress** - Use checkbox format for easy completion tracking

## Output

Create a focused, actionable plan that directly implements what's specified in the tech requirements document. 

Save the completed plan to the same directory as the tech spec with `-plan.md` suffix.

After saving, output: "✅ Created implementation plan: `.agents/features/[identifier]/[identifier]-plan.md`"

Display task summary:
"📊 Generated X tasks across Y phases"

Then provide the command for the next step:
"🚀 To start implementation, run: `/feature-implement .agents/features/[identifier]/[identifier]-plan.md`"
"💡 Add 'true' for batch mode: `/feature-implement .agents/features/[identifier]/[identifier]-plan.md true`"