export function isAbortError(e: unknown): e is { name: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    (e as { name?: unknown }).name === "AbortError"
  );
}

export function safeErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (
    typeof e === "object" &&
    e &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    return (e as { message: string }).message;
  }
  return String(e);
}
