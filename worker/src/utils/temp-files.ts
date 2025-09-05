import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { log } from '../log.js';

const TEMP_BASE_DIR = '/tmp/youtube-processing';

export interface TempFileInfo {
  path: string;
  videoId: string;
  extension: string;
  createdAt: Date;
  sizeBytes?: number;
}

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
        sizeMB: Math.round((stats.size / (1024 * 1024)) * 100) / 100,
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
    totalSizeFreedMB: Math.round((results.totalSizeFreed / (1024 * 1024)) * 100) / 100,
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
export async function cleanupOldTempFiles(maxAgeHours: number = 24): Promise<void> {
  try {
    const files = await fs.readdir(TEMP_BASE_DIR);
    const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const oldFiles: string[] = [];

    for (const file of files) {
      const filePath = join(TEMP_BASE_DIR, file);

      try {
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          oldFiles.push(filePath);
        }
      } catch (error) {
        // File might have been deleted, skip
        continue;
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
      } catch (error) {
        // Skip files that can't be accessed
        continue;
      }
    }

    return fileInfos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

    const totalSizeBytes = fileInfos.reduce((sum, file) => sum + (file.sizeBytes || 0), 0);
    const dates = fileInfos.map((f) => f.createdAt).filter(Boolean);

    return {
      totalFiles: fileInfos.length,
      totalSizeBytes,
      totalSizeMB: Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100,
      oldestFile: dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : undefined,
      newestFile: dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined,
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
export async function checkTempDiskSpace(requiredBytes: number): Promise<boolean> {
  try {
    const stats = await fs.statfs(TEMP_BASE_DIR);
    const availableBytes = stats.bavail * stats.bsize;

    const hasSpace = availableBytes > requiredBytes;

    log('temp_disk_space_check', {
      requiredMB: Math.round((requiredBytes / (1024 * 1024)) * 100) / 100,
      availableMB: Math.round((availableBytes / (1024 * 1024)) * 100) / 100,
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
export async function createTempFile(videoId: string, extension: string, content: string | Buffer): Promise<string> {
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
