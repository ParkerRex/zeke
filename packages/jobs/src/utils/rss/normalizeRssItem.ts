import { canonicalizeUrl } from "../url/canonicalizeUrl";

export type ParsedText =
	| string
	| { "#text"?: string; href?: string }
	| null
	| undefined;

export type NormalizedRssItem = {
	externalId: string;
	url: string;
	title: string | null;
	pubDate: string | null;
};

export function normalizeRssItem(item: Record<string, unknown>): NormalizedRssItem | null {
	const guid = getText(item.guid as ParsedText) ?? (item.id as string) ?? getText(item.link as ParsedText) ?? "";
	const link = canonicalizeUrl(getText(item.link as ParsedText) ?? "");

	if (!guid && !link) {
		return null;
	}

	const externalId = guid || link;
	const url = link || externalId;
	const rawTitle = item.title as ParsedText;
	const title = rawTitle ? getText(rawTitle) ?? String(rawTitle) : null;
	const pubDate = (item.pubDate as string | undefined) ?? (item.updated as string | undefined) ?? null;

	return {
		externalId,
		url,
		title,
		pubDate,
	};
}

function getText(value: ParsedText): string | undefined {
	if (value == null) return undefined;
	if (typeof value === "string") return value;
	if (typeof value === "object") {
		if ("#text" in value && typeof value["#text"] === "string") {
			return value["#text"];
		}
		if ("href" in value && typeof value.href === "string") {
			return value.href;
		}
	}
	return undefined;
}
