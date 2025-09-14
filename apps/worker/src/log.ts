export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function log(
  evt: string,
  extra?: Record<string, unknown>,
  lvl: LogLevel = 'info'
) {
  const _entry = {
    ts: new Date().toISOString(),
    lvl,
    evt,
    msg: evt, // backward-compatible key used in existing filters
    ...extra,
  };
}
