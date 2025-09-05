import { sampleClusters } from '@/features/stories/fixtures/sample-clusters';
import { Cluster } from '@/features/stories/types';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function listStories(): Promise<Cluster[]> {
  try {
    // Query stories with their overlays and YouTube-specific content data
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
        ),
        contents (
          transcript_url,
          transcript_vtt,
          duration_seconds,
          view_count
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

      // Handle contents data - it might be an object or array depending on the query
      const content = Array.isArray(story.contents) ? story.contents[0] : story.contents;

      // Extract YouTube video ID from transcript URL for embed
      let embedUrl = story.primary_url || story.canonical_url || '';
      if (story.kind === 'youtube' && content?.transcript_url) {
        const videoId = content.transcript_url.replace('youtube://', '');
        embedUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }

      return {
        id: story.id,
        title: story.title || 'Untitled Story',
        primaryUrl: story.primary_url || story.canonical_url || '',
        embedKind: mapKindToEmbedKind(story.kind),
        embedUrl,
        overlays: {
          whyItMatters: overlay?.why_it_matters || 'Analysis pending...',
          chili: overlay?.chili || 0,
          confidence: overlay?.confidence || 0,
          sources: parseCitations(overlay?.citations) || [],
        },
        youtubeMetadata:
          story.kind === 'youtube' && content
            ? {
                transcriptUrl: content.transcript_url || undefined,
                transcriptVtt: content.transcript_vtt || undefined,
                durationSeconds: content.duration_seconds || undefined,
                viewCount: content.view_count || undefined,
              }
            : undefined,
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
      console.error('Error fetching story by id:', error);
      // Fallback to sample data
      return sampleClusters.find((c) => c.id === id);
    }

    // Handle overlay data - it might be an object or array depending on the query
    const overlay = Array.isArray(story.story_overlays) ? story.story_overlays[0] : story.story_overlays;

    // Handle contents data - it might be an object or array depending on the query
    const content = Array.isArray(story.contents) ? story.contents[0] : story.contents;

    // Extract YouTube video ID from transcript URL for embed
    let embedUrl = story.primary_url || story.canonical_url || '';
    if (story.kind === 'youtube' && content?.transcript_url) {
      const videoId = content.transcript_url.replace('youtube://', '');
      embedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    return {
      id: story.id,
      title: story.title || 'Untitled Story',
      primaryUrl: story.primary_url || story.canonical_url || '',
      embedKind: mapKindToEmbedKind(story.kind),
      embedUrl,
      overlays: {
        whyItMatters: overlay?.why_it_matters || 'Analysis pending...',
        chili: overlay?.chili || 0,
        confidence: overlay?.confidence || 0,
        sources: parseCitations(overlay?.citations) || [],
      },
      youtubeMetadata:
        story.kind === 'youtube' && content
          ? {
              transcriptUrl: content.transcript_url || undefined,
              transcriptVtt: content.transcript_vtt || undefined,
              durationSeconds: content.duration_seconds || undefined,
              viewCount: content.view_count || undefined,
            }
          : undefined,
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
