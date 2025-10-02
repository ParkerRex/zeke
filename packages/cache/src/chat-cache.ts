import { RedisCache } from "./redis-client";

// Redis-based cache for chat data shared across all server instances
const userContextCache = new RedisCache("chat:user", 30 * 60); // 30 minutes TTL

export interface ChatUserContext {
  userId: string;
  teamId: string;
  teamName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  baseCurrency?: string | null;
  countryCode?: string | null;
  dateFormat?: string | null;
  locale?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string | null;
}

export const chatCache = {
  getUserContext: (
    userId: string,
    teamId: string,
  ): Promise<ChatUserContext | undefined> => {
    return userContextCache.get<ChatUserContext>(`${userId}:${teamId}`);
  },

  setUserContext: (
    userId: string,
    teamId: string,
    context: ChatUserContext,
  ): Promise<void> => {
    return userContextCache.set(`${userId}:${teamId}`, context);
  },
};
