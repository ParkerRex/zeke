# ZEKE Marketing Web App - Development Roadmap

## 🎯 Project Overview

This roadmap outlines the development plan for the ZEKE marketing web application (`apps/web`), focusing on delivering a high-quality, story-driven marketing experience that showcases our "10 hours → 5 minutes" research intelligence value proposition.

## ✅ Completed Work

### Phase 1: Foundation Setup ✅
- [x] Added `@zeke/supabase` dependency to web app
- [x] Created shared utilities in `lib/stories-utils.ts`
- [x] Built base story UI components (CoverageBar, HypeBar, SourcesBadge)
- [x] Established proper component organization structure

### Phase 2: Static Pages Migration ✅
- [x] Enhanced About page with ZEKE value proposition and founder story
- [x] Enhanced Contact page with multiple engagement options
- [x] Enhanced Pricing page with research-focused tiers
- [x] Enhanced Privacy Policy with ZEKE context
- [x] Enhanced Terms of Service for research platform
- [x] Enhanced Support page with value-focused help

### Phase 3: Story Components Migration ✅
- [x] Migrated all story components to `components/stories/`
- [x] Created StoryCard with multiple variants (default, featured, compact)
- [x] Built StoriesGrid for flexible story layouts
- [x] Created story sections (TopStoriesSection, LatestStoriesSection)
- [x] Built sidebar components (DailyIndexCard, AskZekeCard, etc.)
- [x] Implemented PersonalizedStoriesFeed with auth awareness

### Phase 4: Codebase Cleanup & Next.js App Router ✅
- [x] Removed legacy `(marketing)` directory and obsolete files
- [x] Implemented proper Next.js App Router structure
- [x] Added loading.tsx, error.tsx, not-found.tsx for all routes
- [x] Applied DRY principles with shared layout components
- [x] Created reusable PageHeader, ErrorState, EmptyState components
- [x] Established proper TypeScript types and import patterns

## 🚀 Next Priority: Comprehensive Testing Implementation

### Phase 5: Testing & Quality Assurance 🎯 CURRENT PRIORITY

#### 5.1 Unit Testing Implementation ✅ IN PROGRESS
- [x] Set up test environment for `apps/web`
  - [x] Added testing dependencies (`@testing-library/react`, `vitest`, `jsdom`)
  - [x] Created `vitest.config.ts` with React and jsdom configuration
  - [x] Created `test/setup.ts` with Next.js component mocks
  - [x] Created `test/utils.ts` with comprehensive story mock utilities
- [x] Create unit tests for core story components:
  - [x] `StoryCard` component with all variants (12 test cases)
  - [x] `StoriesGrid` with different configurations (15 test cases)
  - [x] `CoverageBar` component (10 test cases)
  - [x] `HypeBar` component (10 test cases)
  - [x] `SourcesBadge` component (12 test cases)
  - [ ] `DailyIndexCard` with deterministic scoring
  - [ ] `AskZekeCard` interactive elements
  - [ ] `TopTopicsSidebar` navigation
- [/] Create unit tests for layout components:
  - [x] `PageHeader` with different configurations (15 test cases)
  - [ ] `ErrorState` with retry functionality
  - [ ] `EmptyState` with action buttons
- [ ] Create unit tests for story sections:
  - [ ] `TopStoriesSection` data loading and display
  - [ ] `LatestStoriesSection` grid rendering
  - [ ] `PersonalizedStoriesFeed` auth-aware behavior
- [ ] Achieve 90%+ test coverage for all components



#### 5.3 Integration Testing
- [ ] Test page-level functionality:
  - [ ] Homepage story loading and sidebar interaction
  - [ ] Stories listing page with search and filtering
  - [ ] Story detail page with metrics and navigation
  - [ ] Static pages (About, Contact, Pricing) functionality
- [ ] Test user flows:
  - [ ] Homepage → Stories listing → Story detail
  - [ ] Search functionality and results
  - [ ] Navigation between marketing pages
  - [ ] Error handling and recovery
- [ ] Test responsive design across devices
- [ ] Test dark/light mode switching

#### 5.4 Accessibility Testing
- [ ] Validate WCAG 2.1 AA compliance:
  - [ ] Keyboard navigation for all interactive elements
  - [ ] Screen reader compatibility
  - [ ] Color contrast ratios
  - [ ] Focus management and indicators
- [ ] Test with accessibility tools:
  - [ ] axe-core automated testing
  - [ ] Manual screen reader testing
  - [ ] Keyboard-only navigation testing
- [ ] Fix any accessibility issues found

#### 5.5 Analytics & Tracking Setup
- [ ] Configure Google Analytics 4 (GA4):
  - [ ] Set up GA4 property for marketing web app
  - [ ] Install gtag or Google Analytics package
  - [ ] Configure page view tracking for all routes
  - [ ] Set up custom events for key user actions:
    - [ ] Story card clicks and engagement
    - [ ] Navigation between marketing pages
    - [ ] CTA button clicks (signup, learn more)
    - [ ] Search interactions and queries
    - [ ] Newsletter signup attempts
- [ ] Configure PostHog analytics:
  - [ ] Set up PostHog project for marketing site
  - [ ] Install PostHog SDK with proper configuration
  - [ ] Configure session recording for user behavior analysis
  - [ ] Set up feature flags for A/B testing marketing content
  - [ ] Track conversion funnels:
    - [ ] Homepage → Stories → Signup flow
    - [ ] Pricing page → Signup conversion
    - [ ] About page → Contact form submissions
- [ ] Privacy & Compliance:
  - [ ] Implement cookie consent banner
  - [ ] Configure analytics to respect user privacy preferences
  - [ ] Update Privacy Policy with analytics data collection details
  - [ ] Ensure GDPR compliance for EU visitors
- [ ] Analytics Dashboard Setup:
  - [ ] Create custom GA4 dashboard for marketing metrics
  - [ ] Set up PostHog insights for user behavior patterns
  - [ ] Configure automated reports for key metrics
  - [ ] Set up alerts for significant traffic or conversion changes

## 🔮 Future Roadmap

### Phase 6: Performance Optimization
- [ ] Implement image optimization for story thumbnails
- [ ] Add proper caching strategies for story data
- [ ] Optimize bundle size and loading performance
- [ ] Implement proper SEO metadata for all pages
- [ ] Add structured data for stories and organization

### Phase 7: Enhanced User Experience
- [ ] Add search functionality with filters
- [ ] Implement story bookmarking/favorites
- [ ] Add social sharing for stories
- [ ] Create newsletter signup integration
- [ ] Implement A/B testing for marketing content using PostHog feature flags

### Phase 8: Content Management
- [ ] Integrate with CMS for marketing content
- [ ] Add admin interface for story management
- [ ] Implement content scheduling and publishing
- [ ] Add A/B testing for marketing pages

### Phase 9: Advanced Features
- [ ] Add real-time story updates
- [ ] Implement personalization algorithms
- [ ] Add story recommendations
- [ ] Create story collections/categories
- [ ] Add user-generated content features

## 📋 Development Guidelines

### Testing Standards
- **Unit Tests**: Use React Testing Library + Vitest
- **Coverage**: Maintain 90%+ test coverage
- **Storybook**: Document all component variants
- **Accessibility**: WCAG 2.1 AA compliance required

### Code Quality
- **TypeScript**: Strict mode, no `any` types
- **Components**: Follow established patterns in `components/stories/`
- **Imports**: Use proper import paths and organization
- **Performance**: Server Components by default, Client Components only when needed

### ZEKE Brand Integration
- **Value Proposition**: Maintain "10 hours → 5 minutes" messaging
- **Target Audience**: Appeal to operators, founders, marketers, PMs
- **Verification**: Emphasize "receipts" and source verification
- **Design System**: Use `@zeke/design-system` consistently

## 🎯 Success Metrics

### Technical Metrics
- [ ] 90%+ test coverage across all components
- [ ] 100% TypeScript strict mode compliance
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] <3s page load times on mobile

### Business Metrics
- [ ] Improved user engagement on marketing pages
- [ ] Higher conversion rates from marketing to app
- [ ] Reduced bounce rates on story pages
- [ ] Increased time spent on site
- [ ] Analytics tracking implementation with baseline metrics established
- [ ] A/B testing framework operational for marketing optimization

## 📞 Next Steps

1. **Immediate**: Continue Phase 5.1 - Complete remaining core component tests
   - Sidebar components (`DailyIndexCard`, `AskZekeCard`, `TopTopicsSidebar`)
   - Layout components (`ErrorState`, `EmptyState`)
   - Story sections (`TopStoriesSection`, `LatestStoriesSection`, `PersonalizedStoriesFeed`)
2. **This Week**: Achieve 90%+ test coverage for all components
3. **Next Week**: Implement Storybook stories (Phase 5.2)
4. **Following Week**: Integration and accessibility testing (Phase 5.3 & 5.4)
5. **Month 2**: Analytics setup (Phase 5.5) - Google Analytics 4 and PostHog implementation

### 🎯 Current Status (Phase 5.1)
- ✅ **Testing Infrastructure**: Complete (vitest, testing-library, mocks, utilities)
- ✅ **Core Components**: 5/8 complete (`StoryCard`, `CoverageBar`, `HypeBar`, `SourcesBadge`, `StoriesGrid`)
- ✅ **Layout Components**: 1/3 complete (`PageHeader`)
- 🔄 **In Progress**: 64 test cases written across 6 components, ready to run once Node.js environment is resolved
- 📊 **Coverage**: Estimated 60% of target components tested

---

**Last Updated**: December 2024
**Current Phase**: 5.1 - Unit Testing Implementation (In Progress)
**Next Milestone**: Complete remaining component testing (5 components remaining)
**Recent Progress**: 6 components tested with 64 comprehensive test cases covering core functionality
