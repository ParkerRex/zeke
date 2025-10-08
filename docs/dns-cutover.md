# DNS Cutover Plan

All production records are hosted in Cloudflare. Update the following A records to point at the Netcup VPS public IP (`152.53.88.183`).

## Production
| Hostname             | Type | Value        |
|----------------------|------|--------------|
| `app.zekehq.com`     | A    | `152.53.88.183`
| `api.zekehq.com`     | A    | `152.53.88.183`
| `engine.zekehq.com`  | A    | `152.53.88.183`
| `zekehq.com`         | A    | `152.53.88.183` *(root)* |
| `www.zekehq.com`     | CNAME -> `zekehq.com` |

## Staging
| Hostname                 | Type | Value        |
|--------------------------|------|--------------|
| `app-staging.zekehq.com` | A    | `152.53.88.183`
| `api-staging.zekehq.com` | A    | `152.53.88.183`
| `engine-staging.zekehq.com` | A | `152.53.88.183`
| `staging.zekehq.com`     | A    | `152.53.88.183`

## Steps (Cloudflare Dashboard)
1. Log into the Cloudflare dashboard and select the `zekehq.com` zone.
2. For each hostname above, create/update the DNS record. Keep proxy enabled (orange cloud) to maintain HTTPS via Cloudflare, or disable if you prefer direct TLS from Caddy.
3. After updating records, wait for propagation (typically < 5 minutes when TTL is 300s).
4. Verify from the VPS:
   ```bash
   dig +short app.zekehq.com
   dig +short app-staging.zekehq.com
   ```
   Each should resolve to `152.53.88.183`.

## Post-DNS Validation
Once records resolve to the VPS:
```bash
curl -I https://app.zekehq.com
curl -I https://api.zekehq.com/health
curl -I https://engine.zekehq.com/health
```
All responses should return `200` or service-specific success codes once containers are running.
