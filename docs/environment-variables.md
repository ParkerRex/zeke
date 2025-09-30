# Environment Variables Documentation

## Overview
This document outlines all required and optional environment variables for the Zeke dashboard and API services.

## Dashboard (apps/dashboard)

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=            # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Supabase anonymous/public key
SUPABASE_SERVICE_ROLE_KEY=           # Supabase service role key (server-side only)

# API Configuration
NEXT_PUBLIC_API_URL=                 # Backend API URL (e.g., http://localhost:3002 for dev)

# Site Configuration
NEXT_PUBLIC_SITE_URL=                # Frontend URL (e.g., http://localhost:3001 for dev)
```

### Optional Variables

```bash
# Stripe (if payments enabled)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe public key
STRIPE_SECRET_KEY=                   # Stripe secret key
STRIPE_WEBHOOK_SECRET=               # Stripe webhook signing secret

# Email Service
RESEND_API_KEY=                      # Resend API key for email sending

# Supabase Additional
SUPABASE_PROJECT_ID=                 # Supabase project ID
SUPABASE_DB_PASSWORD=                # Database password (for migrations)
```

## API (apps/api)

### Required Variables

```bash
# Supabase Configuration
SUPABASE_URL=                        # Your Supabase project URL
SUPABASE_SERVICE_KEY=                # Supabase service role key
SUPABASE_JWT_SECRET=                 # JWT secret for token validation

# Database URLs
DATABASE_PRIMARY_URL=                # Primary database connection URL
DATABASE_PRIMARY_POOLER_URL=         # Pooled connection URL for queries
DATABASE_SESSION_POOLER_URL=         # Session pooler URL (for Drizzle Kit)

# AI Provider (Required for Assistant)
OPENAI_API_KEY=                      # OpenAI API key for chat functionality

# Application Configuration
ALLOWED_API_ORIGINS=                 # CORS allowed origins (e.g., "http://localhost:3001")
zeke_DASHBOARD_URL=                  # Dashboard URL for links/redirects
```

### Optional Variables

```bash
# Additional Database Regions (for edge deployments)
DATABASE_FRA_URL=                    # Frankfurt region URL
DATABASE_SJC_URL=                    # San Jose region URL
DATABASE_IAD_URL=                    # North Virginia region URL

# Additional AI Providers
GOOGLE_GENERATIVE_AI_API_KEY=       # Google Gemini API key (optional)

# Email Service
RESEND_API_KEY=                     # Resend API key for email notifications

# Engine Service
ENGINE_API_URL=                     # External engine service URL
ENGINE_API_KEY=                     # Engine service API key

# Background Jobs
TRIGGER_PROJECT_ID=                 # Trigger.dev project ID
TRIGGER_SECRET_KEY=                 # Trigger.dev secret key

# Monitoring & Logging
LOG_LEVEL=                         # Log level (debug, info, warn, error)

# Redis (for caching)
REDIS_URL=                         # Redis connection URL

# Security
INVOICE_JWT_SECRET=                # JWT secret for invoice generation
zeke_ENCRYPTION_KEY=               # Encryption key for sensitive data

# Environment
NODE_ENV=                          # development, staging, or production

# Polar (if using Polar for payments)
POLAR_ACCESS_TOKEN=                # Polar API access token
POLAR_ENVIRONMENT=                 # sandbox or production
```

## Environment Setup Guide

### Local Development

1. Copy the template files:
```bash
# For Dashboard
cp apps/dashboard/.env.example apps/dashboard/.env.local

# For API
cp apps/api/.env-template apps/api/.env
```

2. Fill in the required variables with your development values.

3. For local Supabase development:
```bash
# Start local Supabase (from packages/db)
supabase start

# Use the provided local URLs and keys in your .env files
```

### Staging/Production Deployment

#### Required for Chat/Assistant Features:
- `OPENAI_API_KEY` - Must be set in API environment
- `NEXT_PUBLIC_API_URL` - Must point to the API service
- `DATABASE_SESSION_POOLER_URL` - Required for Drizzle migrations

#### Checklist:
- [ ] All Supabase URLs and keys are production values
- [ ] Database URLs point to production database
- [ ] API keys are production keys (not development)
- [ ] CORS origins are configured for production domains
- [ ] Redis is configured for production caching
- [ ] Monitoring and logging are properly configured

## Common Issues

1. **Chat not working**: Check `OPENAI_API_KEY` is set in API environment
2. **TRPC connection failed**: Verify `NEXT_PUBLIC_API_URL` points to correct API
3. **Database migrations fail**: Ensure `DATABASE_SESSION_POOLER_URL` is set
4. **Authentication issues**: Check Supabase keys match between dashboard and API
5. **CORS errors**: Verify `ALLOWED_API_ORIGINS` includes your frontend URL

## Security Notes

- Never commit `.env` files to version control
- Use different keys for development, staging, and production
- Rotate API keys regularly
- Store production secrets in a secure vault or environment management system
- Use read-only database URLs where write access isn't needed