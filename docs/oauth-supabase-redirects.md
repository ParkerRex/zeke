# OAuth & Supabase Redirect Checklist

Use the table below to update Google OAuth and Supabase Auth redirect allowlists. Both staging and production deployments share the same Supabase project (hblelrtwdpukaymtpchv).

| Environment | Client | Redirect URI |
|-------------|--------|--------------|
| Development | Google/Supabase | `http://localhost:3001/api/auth/callback` |
| Staging | Google/Supabase | `https://app-staging.zekehq.com/api/auth/callback` |
| Staging | Google/Supabase | `https://staging.zekehq.com/api/auth/callback` *(if marketing site ever initiates auth)* |
| Production | Google/Supabase | `https://app.zekehq.com/api/auth/callback` |
| Production | Google/Supabase | `https://zekehq.com/api/auth/callback` *(optional backup)* |

## Google OAuth Console Steps
1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Select the Zeke OAuth client (ID: `712422195608-uj802c4qnp58bnr31ap95sqq3v3bqnh1.apps.googleusercontent.com`).
3. Under **Authorized redirect URIs**, add the entries above.
4. Under **Authorized JavaScript origins**, ensure `https://app.zekehq.com`, `https://app-staging.zekehq.com`, `https://zekehq.com`, and `https://staging.zekehq.com` are present along with local hosts (`http://localhost:3001`, `http://localhost:3000`).

## Supabase Auth Steps
1. Go to [Supabase dashboard](https://supabase.com/dashboard/project/hblelrtwdpukaymtpchv/auth/url-configuration).
2. Update the **Site URL** to `https://app.zekehq.com` (prod) or `https://app-staging.zekehq.com` (staging) as needed. For shared project, set primary to production but add staging to **Redirect URLs**.
3. In **Redirect URLs**, add the full list from the table.
4. Include local development URL (`http://localhost:3001/api/auth/callback`).

Remember Supabase staging reuses the production project; do **not** delete existing entries until new domains are live.
