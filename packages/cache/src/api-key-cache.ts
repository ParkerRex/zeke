import type { ApiKey } from "@zeke/db/queries";
import { RedisCache } from "./redis-client";

// Redis-backed cache for API key lookups (30 minute TTL)
const cache = new RedisCache("api-key", 30 * 60);

export const apiKeyCache = {
  get: (key: string): Promise<ApiKey | undefined> => cache.get<ApiKey>(key),
  set: (key: string, value: ApiKey): Promise<void> => cache.set(key, value),
  delete: (key: string): Promise<void> => cache.delete(key),
};
