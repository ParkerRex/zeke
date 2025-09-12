export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(
  evt: string,
  extra?: Record<string, unknown>,
  lvl: LogLevel = "info"
) {
  const entry = {
    ts: new Date().toISOString(),
    lvl,
    evt,
    msg: evt, // backward-compatible key used in existing filters
    ...extra,
  };
  // biome-ignore lint/suspicious/noConsole: Structured logging output
  console.log(JSON.stringify(entry));
}
