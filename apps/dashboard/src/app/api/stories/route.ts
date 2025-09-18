import { fetchStoriesForDashboard } from '@/lib/stories';
import { storyQuerySchema, withValidation } from '@/src/utils/api-schemas';
import { createClient } from '@zeke/supabase/server';
import { NextResponse } from 'next/server';

export const GET = withValidation(
  undefined, // No body validation for GET
  storyQuerySchema,
  async (_validatedBody, validatedQuery) => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { limit, offset, kind, q: search } = validatedQuery!;

      const { stories, totalCount, hasMore } = await fetchStoriesForDashboard({
        limit,
        offset,
        kind,
        search,
      });

      return NextResponse.json({
        stories,
        pagination: {
          limit,
          offset,
          totalCount,
          hasMore,
        },
      });
    } catch (_error) {
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      );
    }
  }
);
