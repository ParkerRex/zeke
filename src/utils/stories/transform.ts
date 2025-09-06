import type { Cluster } from '@/types/stories';

export function mapKindToEmbedKind(kind: string | null): Cluster['embedKind'] {
  switch (kind) {
    case 'article':
      return 'article';
    case 'youtube':
      return 'youtube';
    case 'reddit':
      return 'reddit';
    case 'hn':
      return 'hn';
    case 'podcast':
      return 'podcast';
    case 'arxiv':
      return 'arxiv';
    case 'twitter':
      return 'twitter';
    default:
      return 'article';
  }
}

export function parseCitations(citations: unknown): Array<{ title: string; url: string; domain: string }> {
  if (!citations || !Array.isArray(citations)) return [];
  try {
    return citations.map((c: any) => {
      const title = typeof c?.title === 'string' ? c.title : 'Source';
      const url = typeof c?.url === 'string' ? c.url : '';
      let domain = 'unknown';
      try {
        domain = c?.domain || (url ? new URL(url).hostname : 'unknown');
      } catch {}
      return { title, url, domain };
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing citations:', error);
    return [];
  }
}

