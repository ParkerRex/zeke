// Mock for @sentry/nextjs
export const init = () => {};
export const captureException = () => {};
export const captureMessage = () => {};
export const withSentry = (handler: any) => handler;
export const Severity = {
  Error: 'error',
  Warning: 'warning',
  Info: 'info',
};

export default {
  init,
  captureException,
  captureMessage,
  withSentry,
  Severity,
};
