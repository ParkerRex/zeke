export type Bindings = {
  KV: KVNamespace;
  STORAGE: R2Bucket;
  AI: Ai;
  API_SECRET_KEY: string;
  TRIGGER_PROJECT_ID: string;
  TRIGGER_SECRET_KEY: string;
  TRIGGER_WEBHOOK_SECRET?: string;
  YOUTUBE_API_KEY: string;
  YOUTUBE_QUOTA_LIMIT: string;
  YOUTUBE_QUOTA_RESET_HOUR: string;
  YOUTUBE_RATE_LIMIT_BUFFER: string;
};

export type CloudflareBindings = Bindings;
