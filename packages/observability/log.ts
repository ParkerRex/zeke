import { log as logtail } from '@logtail/next';

// Create a minimal console logger for development to reduce memory overhead
const devLogger = {
  debug: (...args: any[]) => {
    // Only log debug in development if explicitly enabled
    if (process.env.DEBUG === 'true') {
      console.debug(...args);
    }
  },
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  log: (...args: any[]) => console.log(...args),
};

export const log = process.env.NODE_ENV === 'production' ? logtail : devLogger;
