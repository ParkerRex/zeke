# Utility Packages

Grab-bag of small packages. Keep them boring and reusable. No product logic here.

## Utils Package (`@zeke/utils`)

Owns:
- Env validation helpers
- Formatting and pure utilities

Does not own:
- Domain logic or API rules

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

## Logger Package (`@zeke/logger`)

Owns:
- Pino logger config and helpers

Does not own:
- Log routing/infra

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

## Encryption Package (`@zeke/encryption`)

Owns:
- Encrypt/decrypt helpers

Does not own:
- Key management policies

### Encrypt/Decrypt

```typescript
import { encrypt, decrypt } from "@zeke/encryption";

const encrypted = await encrypt(sensitiveData, key);
const decrypted = await decrypt(encrypted, key);
```

---

## Location Package (`@zeke/location`)

Owns:
- Country/timezone/currency datasets

Does not own:
- Billing or tax logic

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

## Notifications Package (`@zeke/notifications`)

Owns:
- Notification payload schemas and send helpers

Does not own:
- UI presentation or delivery provider setup

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

## Events Package (`@zeke/events`)

Owns:
- Event tracking helpers

Does not own:
- Analytics backend configuration

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

## Realtime Package (`@zeke/realtime`)

Owns:
- Realtime broadcast helpers and client hooks

Does not own:
- WebSocket server hosting

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

## TSConfig Package (`@zeke/tsconfig`)

Owns:
- Shared TypeScript config

Does not own:
- App-specific compiler overrides

Shared TypeScript configurations:

```json
{
  "extends": "@zeke/tsconfig/base.json"
}
```
