import type { NormalizedRssItem } from "./normalizeRssItem";

export function buildDiscoveryArticle(item: NormalizedRssItem, sourceId: string) {
	return {
		source_id: sourceId,
		external_id: item.externalId,
		url: item.url,
		title: item.title,
		kind: "article" as const,
		metadata: {
			pubDate: item.pubDate,
			src: item.url,
		},
	};
}
