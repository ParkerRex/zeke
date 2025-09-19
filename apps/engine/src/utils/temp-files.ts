import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { log } from '../log.js';

const TEMP_BASE_DIR = '/tmp/youtube-processing';

// Constants for byte conversions
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const ROUNDING_FACTOR = 100;

// Time constants
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_HOUR =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * MILLIS_PER_SECOND;
const DEFAULT_MAX_AGE_HOURS = 24;

export type TempFileInfo = {
  path: string;
  videoId: string;
  extension: string;
  createdAt: Date;
  sizeBytes?: number;
};

/**
 * Create a temporary file path for YouTube processing
 */
export function createTempPath(videoId: string, extension: string): string {
  // Sanitize videoId to prevent path traversal
  const sanitizedVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedVideoId}.${extension}`;
  return join(TEMP_BASE_DIR, filename);
}

/**
 * Ensure temp directory exists with proper permissions
 */
export async function ensureTempDirectory(): Promise<void> {
  try {
    await fs.mkdir(TEMP_BASE_DIR, { recursive: true, mode: 0o755 });

    log('temp_directory_created', {
      path: TEMP_BASE_DIR,
      permissions: '755',
    });
  } catch (error) {
    log(
      'temp_directory_creation_error',
      {
        path: TEMP_BASE_DIR,
        error: String(error),
      },
      'error'
    );
    throw error;
  }
}

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  const results = {
    cleaned: 0,
    errors: 0,
    totalSizeFreed: 0,
  };

  for (const filePath of filePaths) {
    try {
      // Get file size before deletion
      const stats = await fs.stat(filePath);
      results.totalSizeFreed += stats.size;

      // Delete the file
      await fs.unlink(filePath);
      results.cleaned++;

      log('temp_file_cleaned', {
        path: filePath,
        sizeBytes: stats.size,
        sizeMB:
          Math.round((stats.size / BYTES_PER_MB) * ROUNDING_FACTOR) /
          ROUNDING_FACTOR,
      });
    } catch (error) {
      results.errors++;

      log(
        'temp_file_cleanup_error',
        {
          path: filePath,
          error: String(error),
        },
        'warn'
      );
    }
  }

  log('temp_files_cleanup_complete', {
    filesRequested: filePaths.length,
    filesCleaned: results.cleaned,
    errors: results.errors,
    totalSizeFreedMB:
      Math.round((results.totalSizeFreed / BYTES_PER_MB) * ROUNDING_FACTOR) /
      ROUNDING_FACTOR,
  });
}

/**
 * Clean up all temporary files for a specific video
 */
export async function cleanupVideoTempFiles(videoId: string): Promise<void> {
  try {
    const sanitizedVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const files = await fs.readdir(TEMP_BASE_DIR);

    const videoFiles = files
      .filter((file) => file.startsWith(sanitizedVideoId))
      .map((file) => join(TEMP_BASE_DIR, file));

    if (videoFiles.length > 0) {
      await cleanupTempFiles(videoFiles);
    }
  } catch (error) {
    log(
      'video_temp_cleanup_error',
      {
        videoId,
        error: String(error),
      },
      'warn'
    );
  }
}

/**
 * Clean up old temporary files (older than specified hours)
 */
export async function cleanupOldTempFiles(
  maxAgeHours = DEFAULT_MAX_AGE_HOURS
): Promise<void> {
  try {
    const files = await fs.readdir(TEMP_BASE_DIR);
    const cutoffTime = Date.now() - maxAgeHours * MILLIS_PER_HOUR;
    const oldFiles: string[] = [];

    for (const file of files) {
      const filePath = join(TEMP_BASE_DIR, file);

      try {
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          oldFiles.push(filePath);
        }
      } catch {
        // Ignore stat errors for individual files
      }
    }

    if (oldFiles.length > 0) {
      log('cleaning_old_temp_files', {
        count: oldFiles.length,
        maxAgeHours,
      });

      await cleanupTempFiles(oldFiles);
    }
  } catch (error) {
    log(
      'old_temp_cleanup_error',
      {
        maxAgeHours,
        error: String(error),
      },
      'error'
    );
  }
}

/**
 * Get information about all temporary files
 */
export async function getTempFileInfo(): Promise<TempFileInfo[]> {
  try {
    const files = await fs.readdir(TEMP_BASE_DIR);
    const fileInfos: TempFileInfo[] = [];

    for (const file of files) {
      const filePath = join(TEMP_BASE_DIR, file);

      try {
        const stats = await fs.stat(filePath);
        const parts = file.split('.');
        const extension = parts.pop() || '';
        const videoId = parts.join('.');

        fileInfos.push({
          path: filePath,
          videoId,
          extension,
          createdAt: stats.birthtime,
          sizeBytes: stats.size,
        });
      } catch {
        // Ignore stat errors for individual files
      }
    }

    return fileInfos.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  } catch (error) {
    log(
      'temp_file_info_error',
      {
        error: String(error),
      },
      'error'
    );
    return [];
  }
}

/**
 * Get total disk usage of temporary files
 */
export async function getTempDiskUsage(): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  oldestFile?: Date;
  newestFile?: Date;
}> {
  try {
    const fileInfos = await getTempFileInfo();

    const totalSizeBytes = fileInfos.reduce(
      (sum, file) => sum + (file.sizeBytes || 0),
      0
    );
    const dates = fileInfos.map((f) => f.createdAt).filter(Boolean);

    return {
      totalFiles: fileInfos.length,
      totalSizeBytes,
      totalSizeMB:
        Math.round((totalSizeBytes / BYTES_PER_MB) * ROUNDING_FACTOR) /
        ROUNDING_FACTOR,
      oldestFile:
        dates.length > 0
          ? new Date(Math.min(...dates.map((d) => d.getTime())))
          : undefined,
      newestFile:
        dates.length > 0
          ? new Date(Math.max(...dates.map((d) => d.getTime())))
          : undefined,
    };
  } catch (error) {
    log(
      'temp_disk_usage_error',
      {
        error: String(error),
      },
      'error'
    );

    return {
      totalFiles: 0,
      totalSizeBytes: 0,
      totalSizeMB: 0,
    };
  }
}

/**
 * Check if temp directory has enough space for a file
 */
export async function checkTempDiskSpace(
  requiredBytes: number
): Promise<boolean> {
  try {
    const stats = await fs.statfs(TEMP_BASE_DIR);
    const availableBytes = stats.bavail * stats.bsize;

    const hasSpace = availableBytes > requiredBytes;

    log('temp_disk_space_check', {
      requiredMB:
        Math.round((requiredBytes / BYTES_PER_MB) * ROUNDING_FACTOR) /
        ROUNDING_FACTOR,
      availableMB:
        Math.round((availableBytes / BYTES_PER_MB) * ROUNDING_FACTOR) /
        ROUNDING_FACTOR,
      hasSpace,
    });

    return hasSpace;
  } catch (error) {
    log(
      'temp_disk_space_check_error',
      {
        error: String(error),
      },
      'warn'
    );

    // Assume we have space if we can't check
    return true;
  }
}

/**
 * Create a temp file with content
 */
export async function createTempFile(
  videoId: string,
  extension: string,
  content: string | Buffer
): Promise<string> {
  const filePath = createTempPath(videoId, extension);

  try {
    // Ensure directory exists
    await fs.mkdir(dirname(filePath), { recursive: true });

    // Write content
    await fs.writeFile(filePath, content);

    const stats = await fs.stat(filePath);

    log('temp_file_created', {
      path: filePath,
      videoId,
      extension,
      sizeBytes: stats.size,
    });

    return filePath;
  } catch (error) {
    log(
      'temp_file_creation_error',
      {
        path: filePath,
        videoId,
        extension,
        error: String(error),
      },
      'error'
    );
    throw error;
  }
}
