export function canonicalizeUrl(input: string): string {
  try {
    const url = new URL(input);
    const drop = new Set([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_id",
      "gclid",
      "fbclid",
    ]);
    const params = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      if (!drop.has(key.toLowerCase())) {
        params.append(key, value);
      }
    }
    const sorted = new URLSearchParams(
      Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b)),
    );
    url.search = sorted.toString();
    url.hash = "";
    return url.toString();
  } catch {
    return input;
  }
}
