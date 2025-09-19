export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function log(
  evt: string,
  extra?: Record<string, unknown>,
  lvl: LogLevel = 'info'
) {
  const entry = {
    ts: new Date().toISOString(),
    lvl,
    evt,
    msg: evt, // backward-compatible key used in existing filters
    ...extra,
  };

  // Output to console with proper formatting
  if (lvl === 'error') {
    console.error(JSON.stringify(entry));
  } else if (lvl === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
