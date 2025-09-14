import { createSupabaseServerClient } from '@zeke/auth';
import { supabaseAdminClient } from '../clients/admin';
import type { Database, Tables } from '../types/db';
import type {
  ProductWithPrices,
  SubscriptionWithProduct,
} from '../types/pricing';
import type { Cluster } from '../types/stories';
import { mapKindToEmbedKind, parseCitations } from '../utils/transform';

// Fallback data when no stories are available
const sampleClusters: Cluster[] = [];

export async function getAdminFlag() {
  const supabase = await createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id ?? null;
  if (!userId) {
    return { userId: null, isAdmin: false } as const;
  }

  type UserIsAdmin = Pick<Tables<'users'>, 'is_admin'>;

  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .limit(1)
    .maybeSingle<UserIsAdmin>();
  if (error) {
    // Log error in production only
    // console.error("getAdminFlag error", error);
    return { userId, isAdmin: false } as const;
  }
  // data can be null if no user found
  if (!data) {
    return { userId, isAdmin: false } as const;
  }
  return { userId, isAdmin: !!data.is_admin } as const;
}

export async function getUser() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('users').select('*').single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data,
  };
}

export async function getCustomerId({ userId }: { userId: string }) {
  const { data, error } = await supabaseAdminClient
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  if (error) {
    throw new Error('Error fetching stripe_customer_id');
  }
  return data.stripe_customer_id as string;
}

export async function getProducts(): Promise<ProductWithPrices[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  if (error) {
    throw error;
  }

  return (data as ProductWithPrices[]) ?? [];
}

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function getShareSnapshot(
  id: string
): Promise<Cluster | undefined> {
  const story = await getStoryById(id);
  if (story) {
    return story;
  }
  const all = await listStories();
  return all[0];
}

export async function getStoryById(id: string): Promise<Cluster | undefined> {
  try {
    const { data: story, error } = await supabaseAdminClient
      .from('stories')
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
      `
      )
      .eq('id', id)
      .single();

    if (error || !story) {
      return undefined;
    }

    return mapStoryToCluster(story);
  } catch {
    return undefined;
  }
}

export async function getSubscription(): Promise<SubscriptionWithProduct | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as SubscriptionWithProduct | null) ?? null;
}

const STORIES_LIMIT = 50;

type StoryRow = Database['public']['Tables']['stories']['Row'];
type ContentRow = Database['public']['Tables']['contents']['Row'];
type OverlayRow = Database['public']['Tables']['story_overlays']['Row'];

type StoryWithRelations = StoryRow & {
  story_overlays: Pick<
    OverlayRow,
    'why_it_matters' | 'chili' | 'confidence' | 'citations'
  > | null;
  contents: Pick<
    ContentRow,
    'transcript_url' | 'transcript_vtt' | 'duration_seconds' | 'view_count'
  > | null;
};

function mapStoryToCluster(story: StoryWithRelations): Cluster {
  const overlay = story.story_overlays ?? undefined;
  const content = story.contents ?? undefined;
  const embedUrl = buildEmbedUrl(story, content);

  return {
    id: story.id,
    title: story.title || 'Untitled Story',
    primaryUrl: story.primary_url || story.canonical_url || '',
    embedKind: mapKindToEmbedKind(story.kind),
    embedUrl,
    overlays: buildOverlays(overlay),
    youtubeMetadata: buildYoutubeMetadata(story.kind, content),
  };
}

// Nested selects return objects for one-to-one relations; keep optional checks for safety.

function buildEmbedUrl(
  story: StoryWithRelations,
  content: Pick<ContentRow, 'transcript_url'> | undefined
): string {
  if (story.kind === 'youtube' && content?.transcript_url) {
    const videoId = content.transcript_url.replace('youtube://', '');
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return story.primary_url || story.canonical_url || '';
}

function buildOverlays(
  overlay:
    | Pick<OverlayRow, 'why_it_matters' | 'chili' | 'confidence' | 'citations'>
    | undefined
) {
  return {
    whyItMatters: overlay?.why_it_matters || 'Analysis pending...',
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
        'transcript_url' | 'transcript_vtt' | 'duration_seconds' | 'view_count'
      >
    | undefined
) {
  if (kind !== 'youtube' || !content) {
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
  kind?: 'all' | 'youtube' | 'arxiv' | 'podcast' | 'reddit' | 'hn' | 'article';
  search?: string;
  userId?: string; // For user-specific filtering in the future
}

export interface StoriesResult {
  stories: Cluster[];
  totalCount: number;
  hasMore: boolean;
}

export async function listStories(
  filter: StoriesFilter = {}
): Promise<StoriesResult> {
  try {
    const { limit = STORIES_LIMIT, offset = 0, kind = 'all', search } = filter;

    // Build the query
    let query = supabaseAdminClient.from('stories').select(
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
      { count: 'exact' }
    );

    // Apply kind filter
    if (kind !== 'all') {
      query = query.eq('kind', kind);
    }

    // Apply search filter
    if (search?.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `title.ilike.%${searchTerm}%,primary_url.ilike.%${searchTerm}%`
      );
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
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

// Backward compatibility - keep the old function signature
export async function listStoriesLegacy(): Promise<Cluster[]> {
  const result = await listStories({ limit: STORIES_LIMIT });
  return result.stories;
}
