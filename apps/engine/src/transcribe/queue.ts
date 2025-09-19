import { log } from '../log.js';
import { cleanupVideoTempFiles } from '../utils/temp-files.js';
import {
  type TranscriptionResult,
  type WhisperOptions,
  transcribeAudio,
} from './whisper.js';

// Constants
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_HOUR =
  MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const DEFAULT_CLEANUP_AGE_HOURS = 24;
const PROCESS_QUEUE_DELAY_MS = 100;
const CHECK_JOB_INTERVAL_MS = 1000;
const DEFAULT_WAIT_TIMEOUT_MINUTES = 30;
const DEFAULT_WAIT_TIMEOUT_MS =
  DEFAULT_WAIT_TIMEOUT_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const MIN_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30_000;
const RETRY_DELAY_BASE = 2;
const RECENT_JOBS_LIMIT = 10;
const CLEANUP_INTERVAL_MS =
  MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_MAX_CONCURRENT_JOBS = 1; // Whisper is CPU intensive

// Priority order values (lower value = higher priority)
const PRIORITY_HIGH = 0;
const PRIORITY_MEDIUM = 1;
const PRIORITY_LOW = 2;

export type TranscriptionJob = {
  id: string;
  videoId: string;
  audioPath: string;
  options: Partial<WhisperOptions>;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: TranscriptionResult;
  error?: string;
  retryCount: number;
  maxRetries: number;
};

export type AddJobParams = {
  videoId: string;
  audioPath: string;
  options?: Partial<WhisperOptions>;
  priority?: 'high' | 'medium' | 'low';
  maxRetries?: number;
};

export type QueueStats = {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessingTimeMs: number;
  averageProcessingTimeMs: number;
};

class TranscriptionQueue {
  private readonly jobs: Map<string, TranscriptionJob> = new Map();
  private readonly processingJobs: Set<string> = new Set();
  private readonly maxConcurrentJobs: number; // Whisper is CPU intensive
  private isProcessing = false;

  constructor(maxConcurrentJobs = DEFAULT_MAX_CONCURRENT_JOBS) {
    this.maxConcurrentJobs = maxConcurrentJobs;
  }

  /**
   * Add a transcription job to the queue
   */
  addJob(params: AddJobParams): string {
    const {
      videoId,
      audioPath,
      options = {},
      priority = 'medium',
      maxRetries = DEFAULT_MAX_RETRIES,
    } = params;
    const jobId = `${videoId}_${Date.now()}`;

    const job: TranscriptionJob = {
      id: jobId,
      videoId,
      audioPath,
      options,
      priority,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries,
    };

    this.jobs.set(jobId, job);

    log('transcription_job_added', {
      jobId,
      videoId,
      priority,
      maxRetries,
      queueSize: this.jobs.size,
    });

    // Start processing if not already running
    this.processQueue();

    return jobId;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): TranscriptionJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a video
   */
  getJobsForVideo(videoId: string): TranscriptionJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.videoId === videoId
    );
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (this.processingJobs.has(jobId)) {
      log(
        'transcription_job_cancel_processing',
        {
          jobId,
          videoId: job.videoId,
        },
        'warn'
      );
      return false; // Cannot cancel processing jobs
    }

    this.jobs.delete(jobId);

    log('transcription_job_cancelled', {
      jobId,
      videoId: job.videoId,
    });

    return true;
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const jobs = Array.from(this.jobs.values());

    const pending = jobs.filter((job) => !job.startedAt).length;
    const processing = this.processingJobs.size;
    const completed = jobs.filter(
      (job) => job.completedAt && job.result?.success
    ).length;
    const failed = jobs.filter(
      (job) => job.completedAt && !job.result?.success
    ).length;

    const completedJobs = jobs.filter((job) => job.result?.processingTimeMs);
    const totalProcessingTimeMs = completedJobs.reduce(
      (sum, job) => sum + (job.result?.processingTimeMs || 0),
      0
    );
    const averageProcessingTimeMs =
      completedJobs.length > 0
        ? totalProcessingTimeMs / completedJobs.length
        : 0;

    return {
      pending,
      processing,
      completed,
      failed,
      totalProcessingTimeMs,
      averageProcessingTimeMs,
    };
  }

  /**
   * Clean up old completed jobs
   */
  cleanupOldJobs(maxAgeHours = DEFAULT_CLEANUP_AGE_HOURS): void {
    const cutoffTime = Date.now() - maxAgeHours * MILLISECONDS_PER_HOUR;
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt.getTime() < cutoffTime) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      log('transcription_jobs_cleaned', {
        cleanedCount,
        maxAgeHours,
        remainingJobs: this.jobs.size,
      });
    }
  }

  /**
   * Process the queue
   */
  private processQueue(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.processingJobs.size < this.maxConcurrentJobs) {
        const nextJob = this.getNextJob();
        if (!nextJob) {
          break; // No more jobs to process
        }

        // Start processing the job
        this.processJob(nextJob);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get the next job to process (priority-based)
   */
  private getNextJob(): TranscriptionJob | null {
    const pendingJobs = Array.from(this.jobs.values())
      .filter((job) => !(job.startedAt || this.processingJobs.has(job.id)))
      .sort((a, b) => {
        // Sort by priority first, then by creation time
        const priorityOrder = {
          high: PRIORITY_HIGH,
          medium: PRIORITY_MEDIUM,
          low: PRIORITY_LOW,
        };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return pendingJobs[0] || null;
  }

  /**
   * Process a single job
   */
  private async processJob(job: TranscriptionJob): Promise<void> {
    this.processingJobs.add(job.id);
    job.startedAt = new Date();

    log('transcription_job_started', {
      jobId: job.id,
      videoId: job.videoId,
      priority: job.priority,
      retryCount: job.retryCount,
      audioPath: job.audioPath,
    });

    try {
      // Perform transcription
      const result = await transcribeAudio(
        job.audioPath,
        job.videoId,
        job.options
      );

      job.result = result;
      job.completedAt = new Date();

      if (result.success) {
        log('transcription_job_completed', {
          jobId: job.id,
          videoId: job.videoId,
          language: result.language,
          duration: result.duration,
          textLength: result.text.length,
          processingTimeMs: result.processingTimeMs,
        });
      } else {
        log(
          'transcription_job_failed',
          {
            jobId: job.id,
            videoId: job.videoId,
            error: result.error,
            retryCount: job.retryCount,
          },
          'error'
        );

        // Retry if possible
        if (job.retryCount < job.maxRetries) {
          this.retryJob(job);
          return;
        }
      }

      // Clean up temp files for this video
      await cleanupVideoTempFiles(job.videoId);
    } catch (error) {
      job.error = String(error);
      job.completedAt = new Date();

      log(
        'transcription_job_error',
        {
          jobId: job.id,
          videoId: job.videoId,
          error: String(error),
          retryCount: job.retryCount,
        },
        'error'
      );

      // Retry if possible
      if (job.retryCount < job.maxRetries) {
        this.retryJob(job);
        return;
      }

      // Clean up temp files for this video
      await cleanupVideoTempFiles(job.videoId);
    } finally {
      this.processingJobs.delete(job.id);

      // Continue processing queue
      setTimeout(() => this.processQueue(), PROCESS_QUEUE_DELAY_MS);
    }
  }

  /**
   * Retry a failed job
   */
  private retryJob(job: TranscriptionJob): void {
    job.retryCount++;
    job.startedAt = undefined;
    job.completedAt = undefined;
    job.result = undefined;
    job.error = undefined;

    log('transcription_job_retry', {
      jobId: job.id,
      videoId: job.videoId,
      retryCount: job.retryCount,
      maxRetries: job.maxRetries,
    });

    // Add delay before retry (exponential backoff)
    const delayMs = Math.min(
      MIN_RETRY_DELAY_MS * RETRY_DELAY_BASE ** (job.retryCount - 1),
      MAX_RETRY_DELAY_MS
    );
    setTimeout(() => this.processQueue(), delayMs);
  }

  /**
   * Wait for a job to complete
   */
  async waitForJob(
    jobId: string,
    timeoutMs: number = DEFAULT_WAIT_TIMEOUT_MS
  ): Promise<TranscriptionJob | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const job = this.jobs.get(jobId);
      if (!job) {
        return null; // Job not found
      }

      if (job.completedAt) {
        return job; // Job completed
      }

      // Wait a bit before checking again
      await new Promise((resolve) =>
        setTimeout(resolve, CHECK_JOB_INTERVAL_MS)
      );
    }

    log(
      'transcription_job_wait_timeout',
      {
        jobId,
        timeoutMs,
      },
      'warn'
    );

    return null; // Timeout
  }

  /**
   * Get queue status summary
   */
  getQueueStatus(): {
    stats: QueueStats;
    recentJobs: Array<{
      id: string;
      videoId: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      createdAt: Date;
      processingTimeMs?: number;
    }>;
  } {
    const stats = this.getStats();
    const jobs = Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, RECENT_JOBS_LIMIT); // Last 10 jobs

    const recentJobs = jobs.map((job) => {
      let status: 'pending' | 'processing' | 'completed' | 'failed';

      if (this.processingJobs.has(job.id)) {
        status = 'processing';
      } else if (job.completedAt) {
        status = job.result?.success ? 'completed' : 'failed';
      } else {
        status = 'pending';
      }

      return {
        id: job.id,
        videoId: job.videoId,
        status,
        createdAt: job.createdAt,
        processingTimeMs: job.result?.processingTimeMs,
      };
    });

    return { stats, recentJobs };
  }
}

// Global queue instance
export const transcriptionQueue = new TranscriptionQueue(
  DEFAULT_MAX_CONCURRENT_JOBS
);

// Cleanup old jobs every hour
setInterval(() => {
  transcriptionQueue.cleanupOldJobs(DEFAULT_CLEANUP_AGE_HOURS);
}, CLEANUP_INTERVAL_MS);
