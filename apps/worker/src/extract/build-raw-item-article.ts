export function buildRawItemArticle(
  norm: {
    externalId: string;
    url: string;
    title: string | null;
    pubDate: string | null;
  },
  sourceId: string
) {
  return {
    source_id: sourceId,
    external_id: norm.externalId,
    url: norm.url,
    title: norm.title,
    kind: 'article' as const,
    metadata: {
      pubDate: norm.pubDate,
      src: norm.url,
    },
  };
}
