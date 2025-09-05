import { sampleClusters } from '@/features/stories/fixtures/sample-clusters';
import { Cluster } from '@/features/stories/types';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function listStories(): Promise<Cluster[]> {
  try {
    // Query stories with their overlays using the updated types
    const { data: stories, error } = await supabaseAdminClient
      .from('stories')
      .select(
        `
        id,
        title,
        canonical_url,
        primary_url,
        kind,
        created_at,
        story_overlays (
          why_it_matters,
          chili,
          confidence,
          citations
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching stories:', error);
      // Fallback to sample data on error
      return sampleClusters;
    }

    if (!stories || stories.length === 0) {
      console.log('No stories found in database, returning sample data');
      return sampleClusters;
    }

    // Transform database stories to Cluster format
    const clusters: Cluster[] = stories.map((story) => {
      // Handle overlay data - it might be an object or array depending on the query
      const overlay = Array.isArray(story.story_overlays) ? story.story_overlays[0] : story.story_overlays;

      return {
        id: story.id,
        title: story.title || 'Untitled Story',
        primaryUrl: story.primary_url || story.canonical_url || '',
        embedKind: mapKindToEmbedKind(story.kind),
        embedUrl: story.primary_url || story.canonical_url || '',
        overlays: {
          whyItMatters: overlay?.why_it_matters || 'Analysis pending...',
          chili: overlay?.chili || 0,
          confidence: overlay?.confidence || 0,
          sources: parseCitations(overlay?.citations) || [],
        },
      };
    });

    return clusters;
  } catch (error) {
    console.error('Error in listStories:', error);
    // Fallback to sample data on error
    return sampleClusters;
  }
}

export async function getStoryById(id: string): Promise<Cluster | undefined> {
  try {
    const { data: story, error } = await supabaseAdminClient
      .from('stories')
      .select(
        `
        id,
        title,
        canonical_url,
        primary_url,
        kind,
        created_at,
        story_overlays (
          why_it_matters,
          chili,
          confidence,
          citations
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !story) {
      console.error('Error fetching story by id:', error);
      // Fallback to sample data
      return sampleClusters.find((c) => c.id === id);
    }

    // Handle overlay data - it might be an object or array depending on the query
    const overlay = Array.isArray(story.story_overlays) ? story.story_overlays[0] : story.story_overlays;

    return {
      id: story.id,
      title: story.title || 'Untitled Story',
      primaryUrl: story.primary_url || story.canonical_url || '',
      embedKind: mapKindToEmbedKind(story.kind),
      embedUrl: story.primary_url || story.canonical_url || '',
      overlays: {
        whyItMatters: overlay?.why_it_matters || 'Analysis pending...',
        chili: overlay?.chili || 0,
        confidence: overlay?.confidence || 0,
        sources: parseCitations(overlay?.citations) || [],
      },
    };
  } catch (error) {
    console.error('Error in getStoryById:', error);
    // Fallback to sample data
    return sampleClusters.find((c) => c.id === id);
  }
}

export async function getShareSnapshot(id: string): Promise<Cluster | undefined> {
  // For prototype, reuse the same dataset
  const story = await getStoryById(id);
  return story ?? (await listStories())[0];
}

// Helper function to map database kind to frontend EmbedKind
function mapKindToEmbedKind(kind: string | null): Cluster['embedKind'] {
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

// Helper function to parse citations JSON to SourceRef array
function parseCitations(citations: any): Array<{ title: string; url: string; domain: string }> {
  if (!citations) return [];

  try {
    if (Array.isArray(citations)) {
      return citations.map((citation) => ({
        title: citation.title || 'Source',
        url: citation.url || '',
        domain: citation.domain || new URL(citation.url || '').hostname || 'unknown',
      }));
    }
    return [];
  } catch (error) {
    console.error('Error parsing citations:', error);
    return [];
  }
}
