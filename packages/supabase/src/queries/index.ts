import { UTCDate } from "@date-fns/utc";
import {
	addDays,
	endOfMonth,
	isWithinInterval,
	startOfMonth,
	subYears,
} from "date-fns";
import type { Client } from "../types";
import type { Database, Tables } from "../types/db";
import type {
	ProductWithPrices,
	SubscriptionWithProduct,
} from "../types/pricing";
import type { Cluster } from "../types/stories";
import { mapKindToEmbedKind, parseCitations } from "../utils/transform";

// Fallback data when no stories are available
const sampleClusters: Cluster[] = [];

export async function getUserQuery(supabase: Client, userId: string) {
	return supabase
		.from("users")
		.select(
			`
      *,
    `,
		)
		.eq("id", userId)
		.single()
		.throwOnError();
}

export async function getCustomerIdQuery(supabase: Client, userId: string) {
	const { data, error } = await supabase
		.from("customers")
		.select("stripe_customer_id")
		.eq("id", userId)
		.single();

	if (error) {
		throw new Error("Error fetching stripe_customer_id");
	}
	return data.stripe_customer_id as string;
}

export async function getProductsQuery(
	supabase: Client,
): Promise<ProductWithPrices[]> {
	const { data, error } = await supabase
		.from("products")
		.select("*, prices(*)")
		.eq("active", true)
		.eq("prices.active", true)
		.order("metadata->index")
		.order("unit_amount", { referencedTable: "prices" });

	if (error) {
		throw error;
	}

	return (data as ProductWithPrices[]) ?? [];
}

export async function getStoryByIdQuery(
	supabase: Client,
	id: string,
): Promise<Cluster | undefined> {
	try {
		const { data: story, error } = await supabase
			.from("stories")
			.select(
				`
        *,
        story_overlays (
          why_it_matters,
          chili,
          confidence,
          citations
        ),
        contents (
          transcript_url,
          transcript_vtt,
          duration_seconds,
          view_count
        )
      `,
			)
			.eq("id", id)
			.single();

		if (error || !story) {
			return undefined;
		}

		return mapStoryToCluster(story);
	} catch {
		return undefined;
	}
}

type SubscriptionColumn = keyof Tables<"subscriptions">;
type PriceColumn = keyof Tables<"prices">;
type ProductColumn = keyof Tables<"products">;

const subscriptionColumns: SubscriptionColumn[] = [
	"id",
	"status",
	"cancel_at",
	"cancel_at_period_end",
	"canceled_at",
	"created",
	"current_period_end",
	"current_period_start",
	"ended_at",
	"metadata",
	"price_id",
	"quantity",
	"trial_end",
	"trial_start",
	"user_id",
];

const priceColumns: PriceColumn[] = [
	"id",
	"active",
	"currency",
	"description",
	"interval",
	"interval_count",
	"metadata",
	"product_id",
	"trial_period_days",
	"type",
	"unit_amount",
];

const productColumns: ProductColumn[] = [
	"id",
	"active",
	"name",
	"description",
	"image",
	"metadata",
];

const subscriptionSelect = `
  ${subscriptionColumns.join(",\n  ")},
  prices (
    ${priceColumns.join(",\n    ")},
    products (${productColumns.join(", ")})
  )
`;

const activeSubscriptionStatuses: Database["public"]["Enums"]["subscription_status"][] =
	["trialing", "active"];

export async function getSubscriptionQuery(
	supabase: Client,
): Promise<SubscriptionWithProduct | null> {
	const { data } = await supabase
		.from("subscriptions")
		.select(subscriptionSelect)
		.in("status", activeSubscriptionStatuses)
		.maybeSingle()
		.throwOnError();

	return (data as SubscriptionWithProduct | null) ?? null;
}

const STORIES_LIMIT = 50;

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type ContentRow = Database["public"]["Tables"]["contents"]["Row"];
type OverlayRow = Database["public"]["Tables"]["story_overlays"]["Row"];

type StoryWithRelations = StoryRow & {
	story_overlays: Pick<
		OverlayRow,
		"why_it_matters" | "chili" | "confidence" | "citations"
	> | null;
	contents: Pick<
		ContentRow,
		"transcript_url" | "transcript_vtt" | "duration_seconds" | "view_count"
	> | null;
};

function mapStoryToCluster(story: StoryWithRelations): Cluster {
	const overlay = story.story_overlays ?? undefined;
	const content = story.contents ?? undefined;
	const embedUrl = buildEmbedUrl(story, content);

	return {
		id: story.id,
		title: story.title || "Untitled Story",
		primaryUrl: story.primary_url || story.canonical_url || "",
		embedKind: mapKindToEmbedKind(story.kind),
		embedUrl,
		overlays: buildOverlays(overlay),
		youtubeMetadata: buildYoutubeMetadata(story.kind, content),
	};
}

type SourceRow = Database["public"]["Tables"]["sources"]["Row"];
type SourceMetricsRow = Database["public"]["Tables"]["source_metrics"]["Row"];
type SourceHealthRow = Database["public"]["Tables"]["source_health"]["Row"];

export type GetSourcesParams = {
	limit?: number;
	offset?: number;
};

export type SourceWithRelations = SourceRow & {
	source_metrics: SourceMetricsRow[] | null;
	source_health: SourceHealthRow[] | null;
};

export async function getSourcesQuery(
	supabase: Client,
	params: GetSourcesParams,
): Promise<SourceWithRelations[]> {
	const { limit = 50, offset = 0 } = params;

	const { data } = await supabase
		.from("sources")
		.select(
			`id, kind, name, url, domain, active, last_checked, metadata,
        source_metrics:source_metrics(*),
        source_health:source_health(*)
      `,
		)
		.order("updated_at", { ascending: false, nullsFirst: true })
		.range(offset, offset + limit - 1)
		.throwOnError();

	return (data as SourceWithRelations[] | null) ?? [];
}

export type GetPipelineCountsResult = {
	rawItems: number | null;
	contents: number | null;
	stories: number | null;
};

export async function getPipelineCountsQuery(
	supabase: Client,
): Promise<GetPipelineCountsResult> {
	const [rawItems, contents, stories] = await Promise.all([
		supabase
			.from("raw_items")
			.select("id", { count: "exact", head: true })
			.throwOnError(),
		supabase
			.from("contents")
			.select("id", { count: "exact", head: true })
			.throwOnError(),
		supabase
			.from("stories")
			.select("id", { count: "exact", head: true })
			.throwOnError(),
	]);

	return {
		rawItems: rawItems.count ?? null,
		contents: contents.count ?? null,
		stories: stories.count ?? null,
	};
}

type RawItemRow = Database["public"]["Tables"]["raw_items"]["Row"];
type ContentRow = Database["public"]["Tables"]["contents"]["Row"];
type StoryRow = Database["public"]["Tables"]["stories"]["Row"];

export type GetRecentPipelineActivityParams = {
	limit: number;
};

export type PipelineContent = {
	id: ContentRow["id"];
	raw_item_id: ContentRow["raw_item_id"];
	html_url: ContentRow["html_url"];
	created_at: ContentRow["extracted_at"];
	lang: ContentRow["lang"];
};

export type GetRecentPipelineActivityResult = {
	rawItems: Pick<
		RawItemRow,
		"id" | "url" | "title" | "discovered_at" | "kind"
	>[];
	contents: PipelineContent[];
	stories: Pick<
		StoryRow,
		"id" | "title" | "canonical_url" | "primary_url" | "created_at" | "kind"
	>[];
};

export async function getRecentPipelineActivityQuery(
	supabase: Client,
	{ limit }: GetRecentPipelineActivityParams,
): Promise<GetRecentPipelineActivityResult> {
	const [rawItems, contents, stories] = await Promise.all([
		supabase
			.from("raw_items")
			.select("id, url, title, discovered_at, kind")
			.order("discovered_at", { ascending: false })
			.limit(limit)
			.throwOnError(),
		supabase
			.from("contents")
			.select("id, raw_item_id, html_url, extracted_at, lang")
			.order("extracted_at", { ascending: false, nullsFirst: false })
			.limit(limit)
			.throwOnError(),
		supabase
			.from("stories")
			.select("id, title, canonical_url, primary_url, created_at, kind")
			.order("created_at", { ascending: false })
			.limit(limit)
			.throwOnError(),
	]);

	const normalizedContents: PipelineContent[] = (
		(contents.data ?? []) as Pick<
			ContentRow,
			"id" | "raw_item_id" | "html_url" | "extracted_at" | "lang"
		>[]
	).map((content) => ({
		id: content.id,
		raw_item_id: content.raw_item_id,
		html_url: content.html_url,
		created_at: content.extracted_at,
		lang: content.lang,
	}));

	return {
		rawItems: (rawItems.data ?? []) as Pick<
			RawItemRow,
			"id" | "url" | "title" | "discovered_at" | "kind"
		>[],
		contents: normalizedContents,
		stories: (stories.data ?? []) as Pick<
			StoryRow,
			"id" | "title" | "canonical_url" | "primary_url" | "created_at" | "kind"
		>[],
	};
}

// Nested selects return objects for one-to-one relations; keep optional checks for safety.

function buildEmbedUrl(
	story: StoryWithRelations,
	content: Pick<ContentRow, "transcript_url"> | undefined,
): string {
	if (story.kind === "youtube" && content?.transcript_url) {
		const videoId = content.transcript_url.replace("youtube://", "");
		return `https://www.youtube.com/watch?v=${videoId}`;
	}
	return story.primary_url || story.canonical_url || "";
}

function buildOverlays(
	overlay:
		| Pick<OverlayRow, "why_it_matters" | "chili" | "confidence" | "citations">
		| undefined,
) {
	return {
		whyItMatters: overlay?.why_it_matters || "Analysis pending...",
		chili: overlay?.chili || 0,
		confidence: overlay?.confidence || 0,
		sources: parseCitations(overlay?.citations) || [],
	};
}

function buildYoutubeMetadata(
	kind: string | null,
	content:
		| Pick<
				ContentRow,
				"transcript_url" | "transcript_vtt" | "duration_seconds" | "view_count"
		  >
		| undefined,
) {
	if (kind !== "youtube" || !content) {
		return;
	}

	return {
		transcriptUrl: content.transcript_url || undefined,
		transcriptVtt: content.transcript_vtt || undefined,
		durationSeconds: content.duration_seconds || undefined,
		viewCount: content.view_count || undefined,
	};
}

export interface StoriesFilter {
	limit?: number;
	offset?: number;
	kind?: "all" | "youtube" | "arxiv" | "podcast" | "reddit" | "hn" | "article";
	search?: string;
	userId?: string; // For user-specific filtering in the future
}

export interface StoriesResult {
	stories: Cluster[];
	totalCount: number;
	hasMore: boolean;
}

export async function listStoriesQuery(
	supabase: Client,
	filter: StoriesFilter = {},
): Promise<StoriesResult> {
	try {
		const { limit = STORIES_LIMIT, offset = 0, kind = "all", search } = filter;

		let query = supabase.from("stories").select(
			`
        *,
        story_overlays (
          why_it_matters,
          chili,
          confidence,
          citations
        ),
        contents (
          transcript_url,
          transcript_vtt,
          duration_seconds,
          view_count
        )
      `,
			{ count: "exact" },
		);

		if (kind !== "all") {
			query = query.eq("kind", kind);
		}

		if (search?.trim()) {
			const searchTerm = search.trim();
			query = query.or(
				`title.ilike.%${searchTerm}%,primary_url.ilike.%${searchTerm}%`,
			);
		}

		query = query
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		const { data: stories, error, count } = await query;

		if (error) {
			return {
				stories: sampleClusters,
				totalCount: 0,
				hasMore: false,
			};
		}

		if (!stories || stories.length === 0) {
			return {
				stories: sampleClusters,
				totalCount: count ?? 0,
				hasMore: false,
			};
		}

		const clusters: Cluster[] = stories.map(mapStoryToCluster);
		const totalCount = count ?? 0;
		const hasMore = offset + stories.length < totalCount;

		return {
			stories: clusters,
			totalCount,
			hasMore,
		};
	} catch (_error) {
		return {
			stories: sampleClusters,
			totalCount: 0,
			hasMore: false,
		};
	}
}
