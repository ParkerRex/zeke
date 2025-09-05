import { log } from '../log.js';
import { transcribeAudio } from './whisper.js';
import { cleanupVideoTempFiles } from '../utils/temp-files.js';
class TranscriptionQueue {
    jobs = new Map();
    processingJobs = new Set();
    maxConcurrentJobs = 1; // Whisper is CPU intensive
    isProcessing = false;
    constructor(maxConcurrentJobs = 1) {
        this.maxConcurrentJobs = maxConcurrentJobs;
    }
    /**
     * Add a transcription job to the queue
     */
    addJob(videoId, audioPath, options = {}, priority = 'medium', maxRetries = 2) {
        const jobId = `${videoId}_${Date.now()}`;
        const job = {
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
    getJob(jobId) {
        return this.jobs.get(jobId);
    }
    /**
     * Get all jobs for a video
     */
    getJobsForVideo(videoId) {
        return Array.from(this.jobs.values()).filter((job) => job.videoId === videoId);
    }
    /**
     * Cancel a job
     */
    cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return false;
        }
        if (this.processingJobs.has(jobId)) {
            log('transcription_job_cancel_processing', {
                jobId,
                videoId: job.videoId,
            }, 'warn');
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
    getStats() {
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
    cleanupOldJobs(maxAgeHours = 24) {
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
    async processQueue() {
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
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Get the next job to process (priority-based)
     */
    getNextJob() {
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
    async processJob(job) {
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
            }
            else {
                log('transcription_job_failed', {
                    jobId: job.id,
                    videoId: job.videoId,
                    error: result.error,
                    retryCount: job.retryCount,
                }, 'error');
                // Retry if possible
                if (job.retryCount < job.maxRetries) {
                    await this.retryJob(job);
                    return;
                }
            }
            // Clean up temp files for this video
            await cleanupVideoTempFiles(job.videoId);
        }
        catch (error) {
            job.error = String(error);
            job.completedAt = new Date();
            log('transcription_job_error', {
                jobId: job.id,
                videoId: job.videoId,
                error: String(error),
                retryCount: job.retryCount,
            }, 'error');
            // Retry if possible
            if (job.retryCount < job.maxRetries) {
                await this.retryJob(job);
                return;
            }
            // Clean up temp files for this video
            await cleanupVideoTempFiles(job.videoId);
        }
        finally {
            this.processingJobs.delete(job.id);
            // Continue processing queue
            setTimeout(() => this.processQueue(), 100);
        }
    }
    /**
     * Retry a failed job
     */
    async retryJob(job) {
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
    async waitForJob(jobId, timeoutMs = 30 * 60 * 1000) {
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
        log('transcription_job_wait_timeout', {
            jobId,
            timeoutMs,
        }, 'warn');
        return null; // Timeout
    }
    /**
     * Get queue status summary
     */
    getQueueStatus() {
        const stats = this.getStats();
        const jobs = Array.from(this.jobs.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10); // Last 10 jobs
        const recentJobs = jobs.map((job) => ({
            id: job.id,
            videoId: job.videoId,
            status: this.processingJobs.has(job.id)
                ? 'processing'
                : job.completedAt
                    ? job.result?.success
                        ? 'completed'
                        : 'failed'
                    : 'pending',
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
