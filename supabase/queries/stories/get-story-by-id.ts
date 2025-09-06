import { sampleClusters } from '@/fixtures/stories/sample-clusters';
import type { Cluster } from '@/types/stories';
import { mapKindToEmbedKind, parseCitations } from '@/utils/stories/transform';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

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
      return sampleClusters.find((c) => c.id === id);
    }

    const overlay = Array.isArray(story.story_overlays) ? story.story_overlays[0] : story.story_overlays;
    const content = Array.isArray(story.contents) ? story.contents[0] : story.contents;

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
    return sampleClusters.find((c) => c.id === id);
  }
}

// helpers moved to '@/utils/stories/transform'

