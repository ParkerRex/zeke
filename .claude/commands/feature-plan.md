---
name: feature-plan
argument-hint: "[tech-spec-path]"
description: Generate an actionable implementation plan from a technical specification
allowed-tools: Read, Write, Bash(mkdir -p)
---

You are an expert solutions architect and technical lead. Your task is to read a technical specification document and generate a comprehensive, actionable implementation plan with specific atomic tasks.

<tech_spec_path>
{{TECH_SPEC_PATH}}
</tech_spec_path>

## Process Overview

1. Read the technical specification file at the provided path
2. Extract the feature identifier from the file path (the directory name in `.agents/features/[identifier]/`)
3. Systematically analyze all requirements in the tech spec
4. Generate atomic, implementable tasks based on what's actually specified
5. Save the implementation plan to the same directory with `-plan.md` suffix

## Analysis Requirements

Carefully read through the entire tech spec and identify:
- All functional requirements and user stories
- Technical specifications and constraints
- API endpoints, data models, and integrations mentioned
- Performance, security, and scalability requirements
- Any specific technology stack or framework requirements
- Success metrics and acceptance criteria

## Task Generation Guidelines

Create tasks that are:
- **Atomic**: Each task should be completable in 1-4 hours
- **Specific**: Reference actual endpoints, models, and features from the tech spec
- **Actionable**: A developer should be able to start immediately
- **Traceable**: Every task must relate to a specific requirement in the tech spec
- **Ordered**: Arrange by logical dependencies

## Implementation Plan Structure

Your plan must follow this exact structure:

```markdown
# [Feature Name] Implementation Plan

## Executive Summary
[Brief overview of what needs to be built and implementation approach]

## Implementation Tasks

### Phase 1: Foundation
[Only include setup tasks that are actually needed based on tech spec]

### Phase 2: Core Implementation
[Tasks for each functional requirement - one or more tasks per user story]

### Phase 3: Integration
[Only if integrations are specified in tech spec]

### Phase 4: Testing & Quality
[Test tasks based on specified requirements]

### Phase 5: Deployment Preparation
[Only if deployment requirements are mentioned]

## Dependencies and Blockers
[Any external dependencies identified from tech spec]

## Success Criteria
[Extract success metrics directly from tech spec]
```

## Task Format

Each task must follow this exact format:
```markdown
- [ ] TASK-XXX: [Specific action verb] [what to implement/create/configure]
  - Details: [Specific requirements from tech spec]
  - Acceptance: [How to verify completion]
  - Dependencies: [Other tasks that must complete first, or "None"]
```

Number tasks sequentially starting with TASK-001.

## Important Rules

- **Generate only necessary tasks** - Do not create generic placeholder items
- **Base everything on the tech spec** - Every task must trace back to a specific requirement
- **Don't assume requirements** - Only include what's explicitly mentioned in the tech spec
- **Maintain proper dependencies** - Foundation tasks before implementation, implementation before testing
- **Use checkbox format** - All tasks must start with `- [ ]` for progress tracking

## Output Requirements

1. Save the completed implementation plan to: `.agents/features/[identifier]/[identifier]-plan.md`
2. After saving, display exactly:
   - "✅ Created implementation plan: `.agents/features/[identifier]/[identifier]-plan.md`"
   - "📊 Generated X tasks across Y phases"
   - "🚀 To start implementation, run: `/feature-implement .agents/features/[identifier]/[identifier]-plan.md`"
   - "💡 Add 'true' for batch mode: `/feature-implement .agents/features/[identifier]/[identifier]-plan.md true`"

Your final output should only include the confirmation messages above - do not repeat the entire plan content in your response.