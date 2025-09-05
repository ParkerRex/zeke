import { log } from '../log.js';

export interface QuotaStatus {
  used: number;
  remaining: number;
  limit: number;
  resetAt: string;
  canProceed: boolean;
}

export interface QuotaUsage {
  operation: string;
  units: number;
  timestamp: string;
  videoId?: string;
  channelId?: string;
}

/**
 * YouTube API Quota Management Utility
 *
 * Tracks daily quota usage and provides methods to check availability
 * and reserve quota for operations.
 */
export class QuotaTracker {
  private dailyLimit: number;
  private reserveBuffer: number;
  private resetHour: number;
  private usageLog: QuotaUsage[] = [];

  constructor() {
    this.dailyLimit = parseInt(process.env.YOUTUBE_QUOTA_LIMIT || '10000');
    this.reserveBuffer = parseInt(process.env.YOUTUBE_RATE_LIMIT_BUFFER || '500');
    this.resetHour = parseInt(process.env.YOUTUBE_QUOTA_RESET_HOUR || '0');
  }

  /**
   * Check current quota status
   */
  checkQuotaStatus(currentUsage: number = 0): QuotaStatus {
    const now = new Date();
    const resetAt = this.getNextResetTime(now);
    const hasReset = this.hasQuotaReset(now);

    // Reset usage if we've passed the reset time
    const used = hasReset ? currentUsage : this.getTodayUsage();
    const remaining = this.dailyLimit - used;
    const canProceed = remaining > this.reserveBuffer;

    const status: QuotaStatus = {
      used,
      remaining,
      limit: this.dailyLimit,
      resetAt: resetAt.toISOString(),
      canProceed,
    };

    log('quota_status_check', {
      ...status,
      reserveBuffer: this.reserveBuffer,
      hasReset,
    });

    return status;
  }

  /**
   * Reserve quota for an operation
   */
  reserveQuota(operation: string, units: number, metadata?: { videoId?: string; channelId?: string }): boolean {
    const status = this.checkQuotaStatus();

    if (status.remaining < units + this.reserveBuffer) {
      log(
        'quota_reservation_failed',
        {
          operation,
          requestedUnits: units,
          remaining: status.remaining,
          reserveBuffer: this.reserveBuffer,
        },
        'warn'
      );
      return false;
    }

    // Log the reservation (not actual usage yet)
    log('quota_reserved', {
      operation,
      units,
      remaining: status.remaining - units,
      ...metadata,
    });

    return true;
  }

  /**
   * Consume quota after successful operation
   */
  consumeQuota(operation: string, units: number, metadata?: { videoId?: string; channelId?: string }): void {
    const usage: QuotaUsage = {
      operation,
      units,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    this.usageLog.push(usage);

    // Keep only today's usage
    this.cleanupOldUsage();

    log('quota_consumed', {
      operation,
      units,
      totalUsedToday: this.getTodayUsage(),
      remaining: this.dailyLimit - this.getTodayUsage(),
      ...metadata,
    });
  }

  /**
   * Get total quota usage for today
   */
  getTodayUsage(): number {
    const today = new Date().toISOString().split('T')[0];

    return this.usageLog
      .filter((usage) => usage.timestamp.startsWith(today))
      .reduce((total, usage) => total + usage.units, 0);
  }

  /**
   * Get quota usage breakdown by operation type
   */
  getUsageBreakdown(): Record<string, { count: number; units: number }> {
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = this.usageLog.filter((usage) => usage.timestamp.startsWith(today));

    const breakdown: Record<string, { count: number; units: number }> = {};

    for (const usage of todayUsage) {
      if (!breakdown[usage.operation]) {
        breakdown[usage.operation] = { count: 0, units: 0 };
      }
      breakdown[usage.operation].count++;
      breakdown[usage.operation].units += usage.units;
    }

    return breakdown;
  }

  /**
   * Check if quota has reset since last check
   */
  private hasQuotaReset(now: Date): boolean {
    const today = now.toISOString().split('T')[0];
    const resetTime = new Date(today + 'T' + String(this.resetHour).padStart(2, '0') + ':00:00.000Z');

    return now >= resetTime;
  }

  /**
   * Get the next quota reset time
   */
  private getNextResetTime(now: Date): Date {
    const today = now.toISOString().split('T')[0];
    const todayReset = new Date(today + 'T' + String(this.resetHour).padStart(2, '0') + ':00:00.000Z');

    if (now >= todayReset) {
      // Next reset is tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      return new Date(tomorrowStr + 'T' + String(this.resetHour).padStart(2, '0') + ':00:00.000Z');
    } else {
      // Next reset is today
      return todayReset;
    }
  }

  /**
   * Remove old usage entries to prevent memory leaks
   */
  private cleanupOldUsage(): void {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const cutoff = twoDaysAgo.toISOString();

    const originalLength = this.usageLog.length;
    this.usageLog = this.usageLog.filter((usage) => usage.timestamp >= cutoff);

    if (this.usageLog.length < originalLength) {
      log('quota_usage_cleanup', {
        removed: originalLength - this.usageLog.length,
        remaining: this.usageLog.length,
        cutoff,
      });
    }
  }

  /**
   * Get quota allocation recommendations
   */
  getQuotaAllocation(): {
    channelIngestion: number;
    searchQueries: number;
    videoDetails: number;
    reserve: number;
  } {
    const available = this.dailyLimit - this.reserveBuffer;

    return {
      channelIngestion: Math.floor(available * 0.7), // 70% for channel-based ingestion (efficient)
      searchQueries: Math.floor(available * 0.2), // 20% for search queries (expensive)
      videoDetails: Math.floor(available * 0.05), // 5% for video details
      reserve: this.reserveBuffer, // 5% reserve buffer
    };
  }

  /**
   * Log current quota status and recommendations
   */
  logQuotaReport(): void {
    const status = this.checkQuotaStatus();
    const breakdown = this.getUsageBreakdown();
    const allocation = this.getQuotaAllocation();

    log('quota_daily_report', {
      status,
      breakdown,
      allocation,
      efficiency: {
        utilizationRate: (status.used / status.limit) * 100,
        remainingHours: this.getHoursUntilReset(),
      },
    });
  }

  /**
   * Get hours until next quota reset
   */
  private getHoursUntilReset(): number {
    const now = new Date();
    const nextReset = this.getNextResetTime(now);
    const diffMs = nextReset.getTime() - now.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal
  }
}

// Export singleton instance
export const quotaTracker = new QuotaTracker();
