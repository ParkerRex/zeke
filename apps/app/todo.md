# ZEKE App - Post-Migration TODO

## 🚨 Critical - Immediate Testing Required

### 1. Dependency Installation & Build Validation
- [ ] **Install Dependencies**: `pnpm install` (root level to install workspace packages)
- [ ] **Type Generation**: `pnpm run types:generate` (ensure DB types are current)
- [ ] **TypeScript Check**: `pnpm run typecheck` (verify all TS errors resolved)
- [ ] **Build Test**: `pnpm run build` (ensure app builds successfully)
- [ ] **Lint Check**: `pnpm run lint` (verify code quality standards)

### 2. Development Environment Setup
- [ ] **Start Supabase**: `npx supabase start` (local database)
- [ ] **Run Migrations**: `pnpm run db:migrate` (apply latest schema)
- [ ] **Start Dev Server**: `pnpm run dev` (full stack with worker)
- [ ] **Verify Hot Reload**: Test that changes trigger rebuilds correctly

### 3. Authentication Flow Testing
- [ ] **Login Page**: Visit `/login` - verify page loads without errors
- [ ] **Signup Page**: Visit `/signup` - verify page loads without errors
- [ ] **Google OAuth**: Test complete sign-in flow (login → callback → redirect)
- [ ] **Session Management**: Verify user session persists across page refreshes
- [ ] **Sign Out**: Test sign-out functionality works correctly
- [ ] **Auth Middleware**: Verify protected routes redirect unauthenticated users

### 4. Core App Functionality
- [ ] **Home Page**: `/home` loads for authenticated users
- [ ] **Account Page**: `/account` displays user info and subscription status
- [ ] **Admin Console**: `/admin` works for admin users (if applicable)
- [ ] **Navigation**: All navigation links work correctly
- [ ] **Sidebar**: Collapsible sidebar functions properly

### 5. Database Operations
- [ ] **Story Queries**: Verify `listStories()` returns data correctly
- [ ] **User Queries**: Test `getSession()`, `getSubscription()` work
- [ ] **Admin Queries**: Test `getAdminFlag()` functions properly
- [ ] **Mutations**: Verify database writes work (if any test data)

### 6. Component Rendering
- [ ] **Shared Components**: Logo, auth UI, theme selector render correctly
- [ ] **Pricing Components**: Price cards and pricing section display properly
- [ ] **Story Components**: Story rows, grids, and feeds render without errors
- [ ] **Design System**: All `@zeke/design-system` components work correctly

## 🔧 Technical Debt & Improvements

### 7. Missing Components & Files
- [ ] **Admin Console Import**: Fix `../../../components/admin-console` import in admin page
- [ ] **Feed Components**: Verify `feed-list`, `story-row` components exist and work
- [ ] **Search Component**: Fix missing `./search` import in sidebar
- [ ] **Notifications**: Address missing `@zeke/notifications` import

### 8. API Routes & Webhooks
- [ ] **Admin API Routes**: Test all `/api/admin/*` endpoints work
- [ ] **Pipeline API**: Verify `/api/pipeline/*` routes function
- [ ] **Webhook Handler**: Test Stripe webhook processing
- [ ] **Stories API**: Verify `/api/stories/*` endpoints work

### 9. Type Safety & Error Handling
- [ ] **Fix Implicit Any**: Address remaining TypeScript `any` types
- [ ] **Error Boundaries**: Verify error handling works correctly
- [ ] **Loading States**: Test loading states display properly
- [ ] **Empty States**: Verify empty data states render correctly

### 10. Subscription & Pricing Flow
- [ ] **Pricing Page**: Verify pricing cards display correctly
- [ ] **Checkout Flow**: Test Stripe checkout session creation
- [ ] **Subscription Management**: Test subscription updates/cancellations
- [ ] **Customer Creation**: Verify `getOrCreateCustomer` action works

## 🎯 Feature Validation

### 11. Story Management
- [ ] **Story Display**: Stories render with correct metadata
- [ ] **Story Filtering**: Test filtering by kind, date, etc.
- [ ] **Story Sharing**: Verify share functionality works
- [ ] **Story Details**: Test individual story pages

### 12. Admin Features (if applicable)
- [ ] **Source Management**: Add/edit/delete news sources
- [ ] **Pipeline Control**: Start/stop ingestion processes
- [ ] **User Management**: Admin user controls
- [ ] **Analytics Dashboard**: Admin metrics and monitoring

### 13. Performance & UX
- [ ] **Page Load Times**: Verify reasonable load performance
- [ ] **Mobile Responsiveness**: Test on mobile devices
- [ ] **Accessibility**: Basic a11y compliance check
- [ ] **SEO**: Verify meta tags and structured data

## 🚀 Deployment Preparation

### 14. Environment Configuration
- [ ] **Production Env**: Verify all required env vars are documented
- [ ] **Environment Validation**: Test env validation catches missing vars
- [ ] **Secrets Management**: Ensure no secrets in client bundles
- [ ] **Database URLs**: Verify production database connections

### 15. CI/CD Pipeline
- [ ] **Build Pipeline**: Ensure CI builds pass
- [ ] **Test Suite**: Run any existing test suites
- [ ] **Deployment**: Test deployment to staging/production
- [ ] **Health Checks**: Verify app health endpoints work

## 📋 Documentation Updates

### 16. Developer Documentation
- [ ] **README Updates**: Update setup instructions for new structure
- [ ] **Architecture Docs**: Document new monorepo patterns
- [ ] **API Documentation**: Update API endpoint documentation
- [ ] **Deployment Guide**: Update deployment instructions

## ⚠️ Known Issues to Address

### 17. Immediate Fixes Needed
- [ ] **React Version Mismatch**: Fix Next.js/React version compatibility in middleware
- [ ] **Collapsible Component**: Fix design-system collapsible component type errors
- [ ] **Button Variants**: Fix button variant type mismatches in navigation
- [ ] **Missing Dependencies**: Add any missing peer dependencies

### 18. Component Cleanup
- [ ] **Remove Unused**: Clean up any unused component files
- [ ] **Consolidate Duplicates**: Merge any duplicate components
- [ ] **Update Imports**: Ensure all imports use shortest valid paths
- [ ] **Export Consistency**: Verify consistent export patterns

## 🎉 Success Criteria

**Migration is complete when:**
- ✅ App builds without TypeScript errors
- ✅ All pages load without runtime errors  
- ✅ Authentication flow works end-to-end
- ✅ Database operations function correctly
- ✅ All workspace packages are properly integrated
- ✅ Development workflow is smooth and fast

---

**Priority Order:**
1. Complete items 1-6 (Critical Testing) first
2. Address items 7-10 (Technical Debt) next  
3. Validate items 11-13 (Features) thoroughly
4. Prepare items 14-15 (Deployment) as needed
5. Update items 16-18 (Documentation & Cleanup) last
