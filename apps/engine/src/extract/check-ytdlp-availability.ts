import { spawn } from 'node:child_process';
import { log } from '../log.js';

const YTDLP_CHECK_TIMEOUT_MS = 5000;

export async function checkYtDlpAvailability(): Promise<boolean> {
  try {
    const checkPromise = new Promise<boolean>((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', ['--version']);
      ytDlp.on('close', (code) => resolve(code === 0));
      ytDlp.on('error', (error) => reject(error));
    });
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), YTDLP_CHECK_TIMEOUT_MS);
    });
    const isAvailable = await Promise.race([checkPromise, timeoutPromise]);
    log('youtube_ytdlp_availability_check', { available: isAvailable });
    return isAvailable;
  } catch (error) {
    log('youtube_ytdlp_availability_error', { error: String(error) }, 'error');
    return false;
  }
}
