# Debug Authentication Flow

✅ **Debug logging has been added to your code!**

## Run This Now

```bash
# Start the dashboard dev server
cd apps/dashboard
npm run dev
```

Then try to log in with Google and **watch your terminal**. You'll see logs like:
- `[CALLBACK DEBUG - Exchange]` - OAuth code exchange
- `[CALLBACK DEBUG - Session]` - Session creation
- `[CALLBACK DEBUG - Team Check]` - Team count check
- `[MIDDLEWARE DEBUG]` - Every page request

## Quick Debug Steps

### 1. Check Browser Console & Network Tab
Open your browser dev tools (F12) and:
- **Console tab**: Look for any errors or warnings
- **Network tab**: Filter by "auth" or "callback" to see the OAuth flow
- **Application tab** → Cookies: Check if Supabase auth cookies are being set

### 2. Add Debug Logging

Let's add temporary console.log statements to trace the flow:

**In middleware.ts (line 34):**
```typescript
const {
  data: { session },
} = await supabase.auth.getSession();

console.log('[MIDDLEWARE DEBUG]', {
  pathname: newUrl.pathname,
  hasSession: !!session,
  sessionUserId: session?.user?.id,
  timestamp: new Date().toISOString(),
});
```

**In callback route.ts (around line 36):**
```typescript
const {
  data: { session },
} = await getSession();

console.log('[CALLBACK DEBUG]', {
  hasSession: !!session,
  userId: session?.user?.id,
  email: session?.user?.email,
  timestamp: new Date().toISOString(),
});
```

### 3. Run the Dashboard with Logs
```bash
cd apps/dashboard
npm run dev
```

Then watch the terminal for the debug logs as you try to log in.

### 4. Check Environment Variables

Verify these are set correctly:
```bash
# In apps/dashboard/.env.local (or your env file)
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 5. Verify Supabase Configuration

In Supabase dashboard:
- **Site URL**: Should be `http://localhost:3001`
- **Redirect URLs**: Should include `http://localhost:3001/api/auth/callback`
- **Auth Providers** → Google: Should show your client ID

### 6. Common Issues Checklist

- [ ] Browser has third-party cookies enabled
- [ ] No browser extensions blocking cookies/redirects
- [ ] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
- [ ] Google OAuth redirect URI matches exactly: `http://localhost:3001/api/auth/callback`
- [ ] Supabase Site URL is `http://localhost:3001` (no trailing slash)
- [ ] Running on port 3001 (not 3000 or another port)

### 7. Test OAuth Flow Step by Step

1. Click "Sign in with Google"
2. Complete Google authentication
3. Watch the URL bar - you should see:
   - Redirect to Google
   - Redirect back to `http://localhost:3001/api/auth/callback?code=...`
   - Then redirect to `/teams/create` or `/`

If it redirects to `/login` instead, that's the bug location.
