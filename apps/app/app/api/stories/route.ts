import { withAuthAndRateLimit } from '@/lib/rate-limit/api-rate-limit';
import { storyQuerySchema, withValidation } from '@/lib/validation/api-schemas';
import { listStories } from '@zeke/supabase/queries';
import { NextResponse } from 'next/server';

export const GET = withAuthAndRateLimit(
  'authenticated',
  'stories',
  withValidation(
    undefined, // No body validation for GET
    storyQuerySchema,
    async (_validatedBody, validatedQuery, auth, _request) => {
      try {
        const { limit, offset, kind, q: search } = validatedQuery!;

        const result = await listStories({
          limit,
          offset,
          kind,
          search,
          userId: auth.userId, // For future user-specific filtering
        });

        return NextResponse.json({
          stories: result.stories,
          pagination: {
            limit,
            offset,
            totalCount: result.totalCount,
            hasMore: result.hasMore,
          },
        });
      } catch (_error) {
        return NextResponse.json(
          { error: 'Failed to fetch stories' },
          { status: 500 }
        );
      }
    }
  )
);
