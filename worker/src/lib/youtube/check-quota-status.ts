import { log } from "../../log.js";
import type { QuotaStatus } from "./types.js";
import type { YouTubeClient } from "./youtube-client.js";

const PAD_WIDTH = 2;

export function checkQuotaStatus(
  client: Pick<YouTubeClient, "quotaLimit" | "quotaBuffer" | "quotaResetHour">,
  currentUsage = 0
): QuotaStatus {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const resetTime = new Date(
    `${today}T${String(client.quotaResetHour).padStart(PAD_WIDTH, "0")}:00:00.000Z`
  );
  const hasReset = now >= resetTime;

  const used = hasReset ? currentUsage : 0;
  const remaining = client.quotaLimit - used;
  const canProceed = remaining > client.quotaBuffer;

  log("youtube_quota_check", {
    used,
    remaining,
    canProceed,
    quotaLimit: client.quotaLimit,
    quotaBuffer: client.quotaBuffer,
    resetTime: resetTime.toISOString(),
  });

  return { used, remaining, canProceed };
}
