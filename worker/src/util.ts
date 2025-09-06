import { createHash } from "crypto";

export function canonicalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    // drop common tracking params
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
    const kept = new URLSearchParams();
    for (const [k, v] of u.searchParams.entries()) {
      if (!drop.has(k.toLowerCase())) kept.append(k, v);
    }
    // sort params for stability
    const sorted = new URLSearchParams(
      Array.from(kept.entries()).sort(([a], [b]) => a.localeCompare(b))
    );
    u.search = sorted.toString();
    u.hash = "";
    return u.toString();
  } catch {
    return input;
  }
}

export function hashText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex");
}
