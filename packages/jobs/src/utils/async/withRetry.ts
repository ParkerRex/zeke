export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  jitter?: boolean;
  isRetryable?: (error: unknown) => boolean;
};

const SERVER_ERROR_MIN = 500;
const SERVER_ERROR_MAX = 600;

export function isRetryableDefault(error: unknown): boolean {
  const err = error as { code?: string; message?: string; status?: number };

  if (err?.code === "ECONNRESET" || err?.code === "ETIMEDOUT") {
    return true;
  }

  if (typeof err?.status === "number") {
    if (err.status === 429) {
      return true;
    }
    if (err.status >= SERVER_ERROR_MIN && err.status < SERVER_ERROR_MAX) {
      return true;
    }
  }

  const msg = String(err?.message ?? "");
  if (msg.includes("rateLimitExceeded")) {
    return true;
  }
  if (msg.includes("quotaExceeded")) {
    return false;
  }

  return false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    jitter = true,
    isRetryable = isRetryableDefault,
  } = opts;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLast = attempt === maxRetries;
      if (!isRetryable(error) || isLast) {
        throw error;
      }

      const backoff = baseDelayMs * 2 ** (attempt - 1);
      const delay = jitter
        ? Math.round(backoff * (0.5 + Math.random()))
        : backoff;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}
