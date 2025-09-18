import { withAuth } from '@/lib/auth/middleware-helpers';
import { fetchStoryForDashboard } from '@/lib/stories';
import { NextResponse } from 'next/server';

export const GET = withAuth(
  'authenticated',
  async (
    _auth,
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
  ): Promise<Response> => {
    try {
      const { id } = await ctx.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: 'Invalid story ID format' },
          { status: 400 }
        );
      }

      const detail = await fetchStoryForDashboard(id);
      if (!detail) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      }

      return NextResponse.json({
        title: detail.story.title,
        embedKind: detail.story.embedKind,
        embedUrl: detail.story.embedUrl,
        overlays: detail.story.overlays,
        story: detail.story,
        cluster: detail.cluster,
        metrics: detail.metrics,
      });
    } catch (_error) {
      return NextResponse.json(
        { error: 'Failed to fetch story' },
        { status: 500 }
      );
    }
  }
);
