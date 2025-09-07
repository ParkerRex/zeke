const WWW_PREFIX_REGEX = /^www\./;
const HTTP_PREFIX_REGEX = /^https?:\/\//;

export function domainFromUrl(input: string): string {
  try {
    const u = new URL(input);
    return u.hostname.replace(WWW_PREFIX_REGEX, "");
  } catch {
    const m =
      String(input)
        .replace(HTTP_PREFIX_REGEX, "")
        .split("/")[0] || "";
    return m.replace(WWW_PREFIX_REGEX, "");
  }
}
