/*
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a users loads a page in their browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import { init, replayIntegration } from '@sentry/nextjs';
import { keys } from './keys';

export const initializeSentry = (): ReturnType<typeof init> => {
  // Skip Sentry initialization in development to reduce memory overhead
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  return init({
    dsn: keys().NEXT_PUBLIC_SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    replaysOnErrorSampleRate: 1,

    /*
     * This sets the sample rate to be 10%. You may want this to be 100% while
     * in development and sample at a lower rate in production
     */
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
};
