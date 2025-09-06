export function domainFromUrl(input: string): string {
  try {
    const u = new URL(input);
    return u.hostname.replace(/^www\./, '');
  } catch {
    const m = String(input).replace(/^https?:\/\//, '').split('/')[0] || '';
    return m.replace(/^www\./, '');
  }
}

