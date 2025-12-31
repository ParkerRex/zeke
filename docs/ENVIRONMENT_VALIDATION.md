# Environment Variable Validation

## Overview

This project uses a centralized environment variable validation system to ensure all required configuration is present and valid before the application starts. This prevents runtime failures and security issues caused by missing or invalid environment variables.

## Key Features

- **Fail-fast validation**: Application won't start if required variables are missing
- **Type-safe access**: All environment variables are typed and validated with Zod
- **Clear error messages**: Helpful error messages show exactly what's missing
- **Security-first**: Critical secrets must meet minimum length requirements
- **Centralized configuration**: All environment schemas defined in one place

## Implementation

### Validation Module

The validation module is located at `/packages/utils/src/env.ts` and provides:

- **Zod schemas** for all environment variables
- **Getter functions** for validated environment access
- **Application-specific schemas** (base, api, engine, dashboard)
- **Type exports** for TypeScript type safety

### Usage in Applications

#### Engine Application

```typescript
import { getEngineEnv } from "@zeke/utils/env";

// This will validate and fail fast if any required variables are missing
const env = getEngineEnv();

// Now you can safely use validated environment variables
const apiKey = env.API_SECRET_KEY; // Guaranteed to be at least 32 characters
const port = env.PORT ?? 3010;
```

#### API Application

```typescript
import { getApiEnv } from "@zeke/utils/env";

const env = getApiEnv();

// All critical variables are validated
const dbUrl = env.DATABASE_PRIMARY_URL; // Guaranteed to exist
const authSecret = env.BETTER_AUTH_SECRET; // Guaranteed to be at least 32 chars
```

#### Database Client

```typescript
import { getBaseEnv } from "@zeke/utils/env";

const env = getBaseEnv();
const pool = new Pool({
  connectionString: env.DATABASE_PRIMARY_URL, // Validated at startup
});
```

## Environment Variables

### Critical Security Variables

These variables have strict validation to prevent security issues:

- **API_SECRET_KEY**: Must be at least 32 characters
- **BETTER_AUTH_SECRET**: Must be at least 32 characters
- **ZEKE_ENCRYPTION_KEY**: Must be a 64-character hex string (32 bytes) for data encryption
- **DATABASE_PRIMARY_URL**: Required, validated as non-empty string

### Required Variables

See `.env.example` files for a complete list of required variables for each application:

- `/env.example` - Root configuration
- `/apps/api/.env.example` - API-specific variables
- `/apps/engine/.env.example` - Engine-specific variables
- `/apps/dashboard/.env.example` - Dashboard-specific variables

## Error Handling

When required environment variables are missing or invalid, the application will:

1. Print a clear error message showing which variables are problematic
2. Exit immediately before any services start
3. Prevent partial initialization and silent failures

Example error output:

```
❌ Environment variable validation failed:

  - API_SECRET_KEY: API_SECRET_KEY must be at least 32 characters for security
  - DATABASE_PRIMARY_URL: DATABASE_PRIMARY_URL is required

Please check your .env file and ensure all required variables are set.
```

## Migration Guide

### For Existing Code Using `process.env`

**Before:**
```typescript
const apiKey = process.env.API_SECRET_KEY ?? "";
const dbUrl = process.env.DATABASE_PRIMARY_URL!;
```

**After:**
```typescript
import { getApiEnv } from "@zeke/utils/env";

const env = getApiEnv();
const apiKey = env.API_SECRET_KEY; // No fallback needed - validated
const dbUrl = env.DATABASE_PRIMARY_URL; // No ! needed - validated
```

### Adding New Environment Variables

1. Add the variable to the appropriate schema in `/packages/utils/src/env.ts`:

```typescript
const baseEnvSchema = z.object({
  // ... existing variables
  NEW_API_KEY: z.string().min(1, "NEW_API_KEY is required"),
});
```

2. Add to the `.env.example` files with documentation
3. Update application-specific schemas if needed
4. Use the validated environment in your code

## Benefits

### Before Validation System

- 150+ locations accessing `process.env` directly
- Empty string fallbacks for critical secrets (`?? ""`)
- No validation until runtime
- Silent failures in production
- Potential security bypasses

### After Validation System

- ✅ Centralized validation
- ✅ Fail-fast at startup
- ✅ Type-safe access
- ✅ Clear error messages
- ✅ Prevents security issues
- ✅ Better developer experience

## Testing

Test scripts are provided to verify the validation system:

```bash
# Test successful validation
bun run test-env-validation.ts

# Test validation failure handling
bun run test-env-validation-failure.ts
```

## Development Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all required values (see `.env.example` for guidance)

3. Start the application - it will validate on startup:
   ```bash
   bun run dev
   ```

## Production Deployment

Ensure all required environment variables are set in your deployment platform:

- Vercel: Project Settings → Environment Variables
- Fly.io: `flyctl secrets set KEY=value`
- Docker: Environment variables in docker-compose.yml or Dockerfile

The application will fail to deploy if required variables are missing, preventing broken deployments.

## Support

If you encounter issues with environment validation:

1. Check the error message - it will tell you exactly what's wrong
2. Verify your `.env` file has all required variables
3. Compare with `.env.example` to ensure you haven't missed anything
4. Ensure secret keys meet minimum length requirements (32+ characters)

## Security Notes

- Never commit `.env` files to version control
- Use strong, randomly generated secrets (32+ characters)
- Rotate secrets regularly
- Use different secrets for different environments (dev, staging, prod)
- Never expose service role keys or JWT secrets to the frontend
