# ZEKE Production Deployment Checklist

This comprehensive checklist covers all critical steps for deploying the ZEKE monorepo to production, organized in logical dependency order.

## Phase 1: Repository & Branch Protection Setup

### 1.1 Branch Management
- [ ] **Change default branch from `main` to `dev`**
  - Go to GitHub repository settings → General → Default branch
  - Change from `main` to `dev`
  - Update local git config: `git symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/dev`
  - **Acceptance Criteria**: New PRs default to `dev` branch

### 1.2 Branch Protection Rules
- [ ] **Configure `main` branch protection**
  - Settings → Branches → Add rule for `main`
  - ✅ Restrict pushes that create files
  - ✅ Require pull request reviews before merging
  - ✅ Require status checks to pass before merging
  - ✅ Include administrators in restrictions
  - **Acceptance Criteria**: Direct pushes to `main` are blocked

- [ ] **Restrict push permissions to `main`**
  - Settings → Manage access → Add repository owner as only user with push access to `main`
  - Remove push access for all other collaborators to `main` branch
  - **Acceptance Criteria**: Only repository owner can push to `main`

### 1.3 Automated Code Review Setup
- [ ] **Configure Codex integration for PR reviews**
  - Install Codex GitHub App on repository
  - Configure automatic review triggers for new PRs
  - Set review criteria for TypeScript, React, and database changes
  - **Acceptance Criteria**: New PRs automatically get Codex review comments

- [ ] **Set up Augment CLI integration**
  - Install Augment CLI in GitHub Actions workflow
  - Configure automated code analysis on PR creation
  - Set up integration with existing build workflow in `.github/workflows/build.yml`
  - **Acceptance Criteria**: PRs include Augment analysis results

## Phase 2: CI/CD & Deployment Infrastructure

### 2.1 GitHub Actions Integration
- [ ] **Integrate skip CI logic into build workflow**
  - Current skip CI scripts in `apps/app/scripts/skip-ci.js` and `apps/web/scripts/skip-ci.js`
  - Existing workflow already has skip CI logic: `!contains(github.event.head_commit.message, 'skip ci')`
  - Ensure Vercel `ignoreCommand` in `vercel.json` files works correctly
  - **Acceptance Criteria**: Commits with `[skip ci]` bypass builds in both GitHub Actions and Vercel

### 2.2 Vercel Project Setup
- [ ] **Create Vercel project for main app (`apps/app`)**
  - Connect to GitHub repository: `https://github.com/joinvai/zeke.git`
  - Set root directory: `apps/app`
  - Configure build command: `cd ../.. && pnpm build --filter=app`
  - Set output directory: `.next`
  - **Acceptance Criteria**: Main app deploys successfully from `apps/app`

- [ ] **Create Vercel project for marketing site (`apps/web`)**
  - Connect to same GitHub repository: `https://github.com/joinvai/zeke.git`
  - Set root directory: `apps/web`
  - Configure build command: `cd ../.. && pnpm build --filter=web`
  - Set output directory: `.next`
  - **Acceptance Criteria**: Marketing site deploys successfully from `apps/web`

### 2.3 Custom Domain Configuration
- [ ] **Configure custom domain for main app**
  - Add custom domain in Vercel project settings for main app
  - Configure DNS records (A/CNAME) to point to Vercel
  - Set up SSL certificate through Vercel
  - Update `NEXT_PUBLIC_SITE_URL` environment variable
  - **Acceptance Criteria**: Main app accessible via custom domain with HTTPS

### 2.4 Railway Worker Deployment
- [ ] **Configure Railway subdomain for worker API**
  - Deploy worker using existing `apps/worker/scripts/deploy-railway.sh`
  - Configure custom subdomain in Railway dashboard
  - Update `NEXT_PUBLIC_API_URL` to point to Railway worker endpoint
  - Test health check endpoint: `https://your-subdomain.railway.app/healthz`
  - **Acceptance Criteria**: Worker API accessible via Railway subdomain

### 2.5 Supabase Production Database
- [ ] **Set up Supabase production instance**
  - Create new Supabase project for production
  - Run migrations: `supabase migration up --linked`
  - Configure database connection pooling
  - Set up database backups and point-in-time recovery
  - **Acceptance Criteria**: Production database accessible and migrations applied

## Phase 3: Environment Variables & Configuration

### 3.1 Vercel Environment Variables (Main App)
- [ ] **Configure main app production environment variables**
  ```bash
  # Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  
  # Stripe Configuration
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  
  # Email Configuration
  RESEND_FROM=noreply@yourdomain.com
  RESEND_TOKEN=re_...
  
  # Security & Rate Limiting
  ARCJET_KEY=ajkey_...
  
  # URLs
  NEXT_PUBLIC_SITE_URL=https://yourdomain.com
  NEXT_PUBLIC_WEB_URL=https://marketing.yourdomain.com
  NEXT_PUBLIC_API_URL=https://worker.railway.app
  
  # Analytics (configured in Phase 4)
  NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
  NEXT_PUBLIC_POSTHOG_KEY=phc_...
  NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
  ```
  - **Acceptance Criteria**: All required environment variables set and validated

### 3.2 Vercel Environment Variables (Marketing Site)
- [ ] **Configure marketing site production environment variables**
  ```bash
  # Supabase Configuration (same as main app)
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  
  # CMS Configuration
  BASEHUB_TOKEN=bshb_pk_...
  
  # URLs
  NEXT_PUBLIC_APP_URL=https://yourdomain.com
  NEXT_PUBLIC_WEB_URL=https://marketing.yourdomain.com
  
  # Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
  NEXT_PUBLIC_POSTHOG_KEY=phc_...
  ```
  - **Acceptance Criteria**: Marketing site environment variables configured

### 3.3 Railway Worker Environment Variables
- [ ] **Configure Railway worker production environment variables**
  ```bash
  # Database Configuration
  DATABASE_URL=postgresql://worker:password@region.pooler.supabase.com:5432/postgres
  WORKER_DB_PASSWORD=secure_password
  
  # pg-boss Configuration
  BOSS_SCHEMA=pgboss
  BOSS_CRON_TZ=UTC
  BOSS_MIGRATE=true
  
  # API Keys
  OPENAI_API_KEY=sk-proj-...
  YOUTUBE_API_KEY=AIza...
  YOUTUBE_QUOTA_LIMIT=10000
  YOUTUBE_QUOTA_RESET_HOUR=0
  YOUTUBE_RATE_LIMIT_BUFFER=500
  
  # Runtime Configuration
  NODE_ENV=production
  PORT=8080
  USE_SSL=true
  ```
  - **Acceptance Criteria**: Worker connects to production database and APIs

### 3.4 Supabase Production Configuration
- [ ] **Configure Supabase production environment**
  - Set up authentication providers (Google OAuth)
  - Configure site URL and redirect URLs for production domain
  - Set up webhook endpoints for Stripe integration
  - Configure storage buckets and policies
  - **Acceptance Criteria**: Authentication and webhooks work in production

## Phase 4: Analytics & Monitoring Setup

### 4.1 Google Analytics Configuration
- [ ] **Set up Google Analytics for production**
  - Create new GA4 property for production domain
  - Configure enhanced ecommerce tracking for Stripe payments
  - Set up conversion goals (signup, subscription, payment)
  - Add GA measurement ID to environment variables
  - **Acceptance Criteria**: GA tracking active on production site

### 4.2 PostHog Analytics Setup
- [ ] **Configure PostHog for production**
  - Create production PostHog project
  - Set up event tracking for key user actions
  - Configure feature flags for gradual rollouts
  - Add PostHog key and host to environment variables
  - **Acceptance Criteria**: PostHog events tracked in production

### 4.3 Conversion Attribution Setup
- [ ] **Implement traffic-to-conversion tracking**
  - Set up UTM parameter tracking in both GA and PostHog
  - Configure conversion events for subscription purchases
  - Implement attribution tracking for marketing campaigns
  - Set up funnel analysis for signup → subscription flow
  - **Acceptance Criteria**: Full conversion attribution pipeline active

### 4.4 Content Domain Configuration
- [ ] **Update blog/marketing content domains**
  - Update all internal links to point to production domains
  - Configure BaseHub CMS to use production URLs
  - Update social media links and metadata
  - **Acceptance Criteria**: All content points to production domains

## Phase 5: Production Validation

### 5.1 Stripe Payment Validation
- [ ] **Validate Stripe production configuration**
  - Test webhook endpoints with Stripe CLI: `stripe listen --forward-to https://yourdomain.com/api/webhooks`
  - Verify price/product synchronization from Stripe fixtures
  - Test complete payment flow: signup → subscription → billing portal
  - Validate subscription management and cancellation flows
  - **Acceptance Criteria**: End-to-end payment flows work correctly

### 5.2 Pipeline Validation
- [ ] **Test complete ingestion pipeline**
  - Deploy worker to Railway and verify health check
  - Test RSS feed ingestion and content extraction
  - Verify YouTube video processing and transcription
  - Test LLM analysis and story clustering
  - **Acceptance Criteria**: Complete pipeline from ingestion → web interface works

### 5.3 Authentication & User Management
- [ ] **Validate user authentication flows**
  - Test Google OAuth login/signup
  - Verify user session management
  - Test password reset and email verification
  - Validate user data access and RLS policies
  - **Acceptance Criteria**: All authentication flows work correctly

### 5.4 Performance & Monitoring
- [ ] **Set up production monitoring**
  - Configure Sentry for error tracking (already integrated)
  - Set up BetterStack for uptime monitoring
  - Configure database performance monitoring
  - Set up alerts for critical failures
  - **Acceptance Criteria**: Comprehensive monitoring active

### 5.5 Comprehensive Testing
- [ ] **Perform end-to-end production testing**
  - Test all user journeys: signup → onboarding → usage → billing
  - Validate mobile responsiveness and performance
  - Test error handling and edge cases
  - Perform load testing on critical endpoints
  - **Acceptance Criteria**: All critical functionality tested and working

### 5.6 Test Suite Implementation
- [ ] **Implement comprehensive test suites (ONLY AFTER production validation)**
  - Set up unit tests for critical business logic
  - Implement integration tests for API endpoints
  - Create end-to-end tests for user flows
  - Set up automated testing in CI/CD pipeline
  - **Acceptance Criteria**: Test coverage >80% for critical paths

---

## Deployment Checklist Summary

**Pre-deployment Requirements:**
- [ ] All Phase 1-4 tasks completed
- [ ] Environment variables configured and validated
- [ ] DNS records configured and propagated
- [ ] SSL certificates active

**Deployment Day:**
- [ ] Deploy worker to Railway
- [ ] Deploy apps to Vercel
- [ ] Run production validation tests
- [ ] Monitor error rates and performance
- [ ] Verify analytics tracking

**Post-deployment:**
- [ ] Monitor for 24 hours
- [ ] Implement test suites
- [ ] Set up automated monitoring alerts
- [ ] Document production runbook

**Emergency Rollback Plan:**
- [ ] Document rollback procedures for each service
- [ ] Test rollback procedures in staging
- [ ] Prepare communication plan for users

---

## Phase 6: SEO & OpenGraph Optimization

### 6.1 OpenGraph Image Creation
- [ ] **Design OpenGraph images for ZEKE brand**
  - Create 1200x630px images reflecting "AI research intelligence platform" positioning
  - Include "From 10 hours to 5 minutes" value proposition from `docs/brand/exec-overview.md`
  - Design variants for main app (`apps/app`) and marketing site (`apps/web`)
  - Optimize images for social sharing (Twitter, LinkedIn, Facebook)
  - **Acceptance Criteria**: Professional OG images that communicate ZEKE's core value proposition

### 6.2 SEO Metadata Enhancement
- [ ] **Update SEO metadata using brand messaging**
  - Enhance `packages/seo/metadata.ts` utility with brand-specific defaults
  - Update page titles and descriptions based on exec overview messaging
  - Focus on "research intelligence," "AI research," and "productivity tools" keywords
  - Implement consistent messaging: "Turn sprawling content into verified insights"
  - **Acceptance Criteria**: All pages have optimized metadata reflecting brand positioning

- [ ] **Implement structured data (JSON-LD)**
  - Expand existing `packages/seo/json-ld.tsx` implementation
  - Add Organization schema for ZEKE company information
  - Implement SoftwareApplication schema for the main app
  - Add WebSite schema with search action capabilities
  - Configure Article schema for blog posts with proper attribution
  - **Acceptance Criteria**: Rich snippets appear in search results

- [ ] **Optimize page-specific SEO**
  - Update homepage metadata: "ZEKE - Turn 10 Hours of Research into 5 Minutes"
  - Stories page: "AI-Powered Research Stories with Verified Insights"
  - Blog pages: Include "research intelligence" and "AI analysis" keywords
  - Legal pages: Maintain brand voice while covering compliance topics
  - **Acceptance Criteria**: Each page has unique, optimized metadata

## Phase 7: CLI Tool Integration & Optimization

### 7.1 Vercel Configuration Analysis & Enhancement
- [ ] **Document current Vercel.json functionality**
  - Current setup: Basic ignore command using `node scripts/skip-ci.js`
  - Both `apps/app/vercel.json` and `apps/web/vercel.json` have identical minimal config
  - Skip CI logic: Checks for `[skip ci]` in commit messages to bypass builds
  - **Acceptance Criteria**: Complete documentation of current Vercel configuration

- [ ] **Implement Vercel CLI optimizations**
  - Add build optimization settings (output compression, edge functions)
  - Configure custom headers for security and performance
  - Implement preview deployment automation for PR branches
  - Add environment variable management via Vercel CLI
  - Configure custom domains and SSL via CLI commands
  - **Acceptance Criteria**: Enhanced Vercel configuration with CLI automation

- [ ] **Vercel deployment automation**
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "ignoreCommand": "node scripts/skip-ci.js",
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" }
        ]
      }
    ],
    "rewrites": [
      { "source": "/healthz", "destination": "/api/health" }
    ]
  }
  ```
  - **Acceptance Criteria**: Production-ready Vercel configuration with security headers

### 7.2 Railway CLI Enhancement
- [ ] **Analyze current Railway deployment capabilities**
  - Current script: `apps/worker/scripts/deploy-railway.sh` provides basic deployment
  - Features: Build validation, environment variable checking, deployment status monitoring
  - Missing: Advanced monitoring, scaling automation, rollback capabilities
  - **Acceptance Criteria**: Complete analysis of current vs. potential Railway CLI usage

- [ ] **Implement enhanced Railway CLI features**
  - Add automated scaling based on queue depth and CPU usage
  - Implement health check monitoring with automatic restart capabilities
  - Configure log aggregation and error alerting via Railway CLI
  - Add rollback automation for failed deployments
  - Implement environment-specific deployment pipelines (staging/production)
  - **Acceptance Criteria**: Production-grade Railway deployment automation

- [ ] **Railway monitoring and management automation**
  ```bash
  # Enhanced deployment script additions:
  railway metrics --service worker --period 1h  # Monitor performance
  railway scale --service worker --replicas 2   # Auto-scaling
  railway logs --service worker --follow --filter error  # Error monitoring
  railway rollback --service worker --to previous  # Rollback capability
  ```
  - Set up automated alerts for high error rates or performance degradation
  - Configure automatic scaling policies based on workload
  - **Acceptance Criteria**: Comprehensive Railway CLI integration for production operations
