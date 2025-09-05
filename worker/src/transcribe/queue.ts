import { log } from '../log.js';
import { transcribeAudio, WhisperOptions, TranscriptionResult } from './whisper.js';
import { cleanupVideoTempFiles } from '../utils/temp-files.js';

export interface TranscriptionJob {
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
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessingTimeMs: number;
  averageProcessingTimeMs: number;
}

class TranscriptionQueue {
  private jobs: Map<string, TranscriptionJob> = new Map();
  private processingJobs: Set<string> = new Set();
  private maxConcurrentJobs: number = 1; // Whisper is CPU intensive
  private isProcessing: boolean = false;

  constructor(maxConcurrentJobs: number = 1) {
    this.maxConcurrentJobs = maxConcurrentJobs;
  }

  /**
   * Add a transcription job to the queue
   */
  addJob(
    videoId: string,
    audioPath: string,
    options: Partial<WhisperOptions> = {},
    priority: 'high' | 'medium' | 'low' = 'medium',
    maxRetries: number = 2
  ): string {
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
    return Array.from(this.jobs.values()).filter((job) => job.videoId === videoId);
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
    const completed = jobs.filter((job) => job.completedAt && job.result?.success).length;
    const failed = jobs.filter((job) => job.completedAt && !job.result?.success).length;

    const completedJobs = jobs.filter((job) => job.result?.processingTimeMs);
    const totalProcessingTimeMs = completedJobs.reduce((sum, job) => sum + (job.result?.processingTimeMs || 0), 0);
    const averageProcessingTimeMs = completedJobs.length > 0 ? totalProcessingTimeMs / completedJobs.length : 0;

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
  cleanupOldJobs(maxAgeHours: number = 24): void {
    const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
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
  private async processQueue(): Promise<void> {
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
      .filter((job) => !job.startedAt && !this.processingJobs.has(job.id))
      .sort((a, b) => {
        // Sort by priority first, then by creation time
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
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
      const result = await transcribeAudio(job.audioPath, job.videoId, job.options);

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
          await this.retryJob(job);
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
        await this.retryJob(job);
        return;
      }

      // Clean up temp files for this video
      await cleanupVideoTempFiles(job.videoId);
    } finally {
      this.processingJobs.delete(job.id);

      // Continue processing queue
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Retry a failed job
   */
  private async retryJob(job: TranscriptionJob): Promise<void> {
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
    const delayMs = Math.min(1000 * Math.pow(2, job.retryCount - 1), 30000);
    setTimeout(() => this.processQueue(), delayMs);
  }

  /**
   * Wait for a job to complete
   */
  async waitForJob(jobId: string, timeoutMs: number = 30 * 60 * 1000): Promise<TranscriptionJob | null> {
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      .slice(0, 10); // Last 10 jobs

    const recentJobs = jobs.map((job) => ({
      id: job.id,
      videoId: job.videoId,
      status: this.processingJobs.has(job.id)
        ? ('processing' as const)
        : job.completedAt
        ? job.result?.success
          ? ('completed' as const)
          : ('failed' as const)
        : ('pending' as const),
      createdAt: job.createdAt,
      processingTimeMs: job.result?.processingTimeMs,
    }));

    return { stats, recentJobs };
  }
}

// Global queue instance
export const transcriptionQueue = new TranscriptionQueue(1);

// Cleanup old jobs every hour
setInterval(() => {
  transcriptionQueue.cleanupOldJobs(24);
}, 60 * 60 * 1000);
