# Utility Packages

Shared utilities and helper packages.

## Utils Package

**Package:** `@zeke/utils`

### Environment Validation

```typescript
import { getBaseEnv, getApiEnv } from "@zeke/utils/env";

const env = getBaseEnv();
console.log(env.DATABASE_PRIMARY_URL);
console.log(env.NODE_ENV);
```

### Formatting

```typescript
import { formatCurrency, formatDate, formatNumber } from "@zeke/utils";

formatCurrency(1000, "USD");  // "$1,000.00"
formatDate(new Date());       // "Jan 1, 2024"
formatNumber(1234567);        // "1,234,567"
```

### Tax Calculation

```typescript
import { calculateTax } from "@zeke/utils";

const tax = calculateTax(100, "US", "CA");
```

---

## Logger Package

**Package:** `@zeke/logger`

### Usage

```typescript
import { logger } from "@zeke/logger";

logger.info("User logged in", { userId: "123" });
logger.error("Failed to process", { error: err.message });
logger.debug("Debug info", { data });
logger.warn("Warning", { context });
```

### Configuration

Uses Pino with structured JSON logs:

```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",  // Development only
  },
});
```

---

## Encryption Package

**Package:** `@zeke/encryption`

### Encrypt/Decrypt

```typescript
import { encrypt, decrypt } from "@zeke/encryption";

const encrypted = await encrypt(sensitiveData, key);
const decrypted = await decrypt(encrypted, key);
```

---

## Location Package

**Package:** `@zeke/location`

### Countries

```typescript
import { countries, getCountryByCode } from "@zeke/location";

const usa = getCountryByCode("US");
// { code: "US", name: "United States", ... }
```

### Timezones

```typescript
import { timezones, getTimezoneOffset } from "@zeke/location";

const offset = getTimezoneOffset("America/New_York");
// -5 or -4 depending on DST
```

### Currencies

```typescript
import { currencies, getCurrencySymbol } from "@zeke/location";

getCurrencySymbol("USD");  // "$"
getCurrencySymbol("EUR");  // "€"
```

---

## Notifications Package

**Package:** `@zeke/notifications`

### Send Notification

```typescript
import { sendNotification } from "@zeke/notifications";

await sendNotification({
  userId: "123",
  type: "story_update",
  title: "New story available",
  body: "Check out the latest content",
});
```

---

## Events Package

**Package:** `@zeke/events`

### Track Event

```typescript
import { trackEvent } from "@zeke/events/server";

await trackEvent("story_viewed", {
  storyId: "123",
  userId: "456",
});
```

### Client Events

```typescript
import { track } from "@zeke/events/client";

track("button_clicked", { button: "signup" });
```

---

## Realtime Package

**Package:** `@zeke/realtime`

### Server

```typescript
import { broadcast } from "@zeke/realtime/server";

await broadcast("story:123", {
  type: "update",
  data: story,
});
```

### Client Hook

```typescript
import { useRealtime } from "@zeke/realtime/client";

useRealtime({
  channel: `story:${storyId}`,
  onMessage: (event) => {
    console.log("Update:", event);
  },
});
```

---

## TSConfig Package

**Package:** `@zeke/tsconfig`

Shared TypeScript configurations:

```json
{
  "extends": "@zeke/tsconfig/base.json"
}
```

Available configs:
- `base.json` - Base configuration
- `react.json` - React apps
- `nextjs.json` - Next.js apps

---

## Engine Client Package

**Package:** `@zeke/engine-client`

```typescript
import { engineClient } from "@zeke/engine-client";

const content = await engineClient.ingest({
  url: "https://youtube.com/watch?v=xxx",
});
```

---

## Desktop Client Package

**Package:** `@zeke/desktop-client`

Desktop-specific utilities for Tauri integration.
