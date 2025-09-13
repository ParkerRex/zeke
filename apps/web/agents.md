# ZEKE Marketing Web App - Agents Guide

This guide orients coding agents to the ZEKE marketing web application (`apps/web`) so they can work effectively on the marketing site.

## Project Overview

The ZEKE marketing web app is a Next.js application that serves as the public-facing marketing site for ZEKE's AI-powered news intelligence platform. It showcases the "10 hours → 5 minutes" research intelligence value proposition through interactive story components and marketing pages.

**Key Goals:**
- Demonstrate ZEKE's story analysis capabilities through rich UI components
- Convert visitors from marketing pages to the main application
- Provide compelling examples of AI-powered news intelligence
- Maintain high performance and accessibility standards

**Target Audience:** Operators, founders, marketers, product managers who need rapid research intelligence.

## Architecture & Technology Stack

- **Framework**: Next.js 15.5.3 with App Router
- **React**: 19.1.0 with TypeScript strict mode
- **Styling**: Tailwind CSS 4.1.7 with shadcn/ui components
- **Design System**: `@zeke/design-system` workspace package
- **Data**: Story data from `@zeke/supabase/types` (Cluster type)
- **Testing**: Vitest + React Testing Library + jsdom

## Build & Run Commands

```bash
# Development
pnpm dev                    # Start dev server on port 3001

# Building
pnpm build                  # Build for production
pnpm start                  # Start production server

# Quality Assurance
pnpm typecheck              # TypeScript type checking
pnpm test                   # Run unit tests
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run tests with coverage report

# Utilities
pnpm clean                  # Clean build artifacts
pnpm analyze                # Bundle analysis
```

## Project Structure

```
apps/web/
├── app/[locale]/           # Next.js App Router pages
├── components/
│   ├── stories/            # Story-related components
│   └── layout/             # Shared layout components
├── lib/
│   └── stories-utils.ts    # Story utility functions
├── test/
│   ├── components/         # Component test files
│   ├── setup.ts           # Test environment setup
│   └── utils.ts           # Test utilities and mocks
├── vitest.config.ts        # Test configuration
└── todo.md                # Development roadmap
```

## Key Components

### Story Components (`components/stories/`)

**Core Display Components:**
- `StoryCard` - Main story display with variants (default, featured, compact)
- `StoriesGrid` - Responsive grid layout for multiple stories
- `CoverageBar` - Visual coverage percentage indicator
- `HypeBar` - Hype level indicator with color coding
- `SourcesBadge` - Source count display

**Section Components:**
- `TopStoriesSection` - Featured stories section
- `LatestStoriesSection` - Recent stories grid
- `PersonalizedStoriesFeed` - Auth-aware story recommendations

**Sidebar Components:**
- `DailyIndexCard` - Daily sentiment/market index
- `AskZekeCard` - Interactive question prompts
- `TopTopicsSidebar` - Topic navigation
- `PromoCard` - Promotional content

### Layout Components (`components/layout/`)

- `PageHeader` - Consistent page headers with actions
- `ErrorState` - Error handling with retry functionality
- `EmptyState` - Empty state messaging with CTAs

### Story Utilities (`lib/stories-utils.ts`)

**Key Functions:**
- `deterministicPercent(id)` - Generate consistent coverage percentages
- `hypePercent(cluster)` - Calculate hype from chili rating (0-5 → 0-100%)
- `getKindLabel(kind)` - Human-readable labels for embed types
- `domainFromUrl(url)` - Extract clean domain names
- `imageFor(story)` - Get story thumbnail (currently placeholder)

**Constants:**
- `MIN_SOURCES_COUNT = 3` - Minimum sources to display
- `MIN_COVERAGE_PERCENT = 35` - Minimum coverage percentage
- `MAX_COVERAGE_PERCENT = 90` - Maximum coverage percentage

## Testing Patterns

### Test Structure

```
test/
├── components/stories/     # Component tests mirror component structure
├── setup.ts               # Global test setup and mocks
└── utils.ts               # Test utilities and mock data
```

### Mock Data Utilities (`test/utils.ts`)

**Core Functions:**
```typescript
// Create single mock story
createMockStory(overrides?: Partial<Cluster>): Cluster

// Create multiple stories for grid testing
createMockStories(count: number, baseOverrides?: Partial<Cluster>): Cluster[]

// Create story with specific embed type
createMockStoryWithKind(kind: EmbedKind, overrides?: Partial<Cluster>): Cluster

// Create story with specific hype level
createMockStoryWithChili(chili: number, overrides?: Partial<Cluster>): Cluster
```

### Testing Best Practices

**Component Testing Pattern:**
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComponentName } from '../../../components/path/component-name';
import { createMockStory } from '../../utils';

describe('ComponentName', () => {
  it('renders with required props', () => {
    const story = createMockStory();
    render(<ComponentName story={story} />);
    
    expect(screen.getByText(story.title)).toBeInTheDocument();
  });
});
```

**Mock Strategy:**
- Use `createMockStory()` for realistic test data
- Mock utility functions in `lib/stories-utils.ts` for deterministic tests
- Mock Next.js components (Image, Link) in `test/setup.ts`
- Test all component variants and edge cases

### Current Test Coverage

**Completed (32 test cases):**
- ✅ `CoverageBar` - 10 test cases (percentage display, clamping, styling)
- ✅ `HypeBar` - 10 test cases (hype levels, colors, boundaries)
- ✅ `StoryCard` - 12 test cases (variants, props, data handling)

**Remaining Components:**
- `SourcesBadge`, `StoriesGrid`, `DailyIndexCard`, `AskZekeCard`
- `TopTopicsSidebar`, `PageHeader`, `ErrorState`, `EmptyState`
- `TopStoriesSection`, `LatestStoriesSection`, `PersonalizedStoriesFeed`

## Component Development Guidelines

### Naming Conventions

- **Components**: PascalCase with descriptive names (`StoryCard`, `CoverageBar`)
- **Files**: kebab-case matching component name (`story-card.tsx`)
- **Props**: camelCase with clear intent (`showHype`, `variant`, `className`)
- **Test files**: `component-name.test.tsx` in mirrored directory structure

### Component Patterns

**Props Interface:**
```typescript
interface ComponentProps {
  // Required props first
  story: Cluster;
  
  // Optional configuration
  variant?: 'default' | 'featured' | 'compact';
  showHype?: boolean;
  showImage?: boolean;
  
  // Standard props last
  className?: string;
}
```

**Component Structure:**
```typescript
export function ComponentName({
  story,
  variant = 'default',
  showHype = false,
  className
}: ComponentProps) {
  // Derived values
  const coverage = deterministicPercent(story.id);
  const hype = hypePercent(story);
  
  // Conditional logic
  const isCompact = variant === 'compact';
  
  return (
    <Card className={cn("base-styles", isCompact && "compact-styles", className)}>
      {/* Component content */}
    </Card>
  );
}
```

### Story Data Types

**Core Type (`@zeke/supabase/types`):**
```typescript
type Cluster = {
  id: string;
  title: string;
  primaryUrl: string;
  embedKind: EmbedKind;
  embedUrl: string;
  overlays: Overlays;
  youtubeMetadata?: YouTubeMetadata;
};

type Overlays = {
  whyItMatters: string;
  chili: number;           // 0-5 hype rating
  confidence: number;      // 0-100 confidence score
  sources: SourceRef[];    // Array of source references
};
```

## Development Workflow

### Adding New Components

1. **Create Component**: `components/stories/new-component.tsx`
2. **Add to Index**: Export from `components/stories/index.ts`
3. **Create Tests**: `test/components/stories/new-component.test.tsx`
4. **Update Utils**: Add mock helpers to `test/utils.ts` if needed
5. **Run Tests**: `pnpm test` to verify functionality

### Testing Workflow

1. **Write Tests First**: Create comprehensive test cases
2. **Mock Dependencies**: Use utilities from `test/utils.ts`
3. **Test Variants**: Cover all props and edge cases
4. **Check Coverage**: `pnpm test:coverage` for coverage metrics
5. **Watch Mode**: `pnpm test:watch` during development

### Quality Standards

- **TypeScript**: Strict mode, no `any` types
- **Testing**: 90%+ coverage target for all components
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Server Components by default
- **Responsive**: Mobile-first design approach

## Troubleshooting

### Common Issues

**Test Environment:**
- Ensure Node.js version compatibility for package installation
- Run `pnpm install` from workspace root if dependencies missing
- Check `vitest.config.ts` for proper path aliases

**Component Development:**
- Import types from `@zeke/supabase/types` for story data
- Use `cn()` utility for conditional className merging
- Mock external dependencies in tests for isolation

**Story Data:**
- Use `createMockStory()` for consistent test data
- Check `lib/stories-utils.ts` for data transformation functions
- Verify `Cluster` type structure matches actual data

### Getting Help

- Check `todo.md` for current development priorities
- Review existing component tests for patterns
- Use `test/utils.ts` mock functions for consistent test data
- Follow established component structure and naming conventions
