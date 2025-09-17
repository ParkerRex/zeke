import {
  adminQuerySchema,
  createSourceSchema,
  updateSourceSchema,
  withValidation,
} from '@/src/utils/api-schemas';
import { getAdminFlag } from '@zeke/supabase/queries';
import { createClient } from '@zeke/supabase/server';
import {
  getSourcesQuery,
  type SourceWithRelations,
} from '@zeke/supabase/queries';
import { createSource, updateSource } from '@zeke/supabase/mutations';
import { NextResponse } from 'next/server';

// Types are now defined in validation schemas

export const GET = withValidation(
  undefined, // No body validation for GET
  adminQuerySchema,
  async (_validatedBody, validatedQuery) => {
    const { isAdmin } = await getAdminFlag();

    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 403 }
      );
    }

    try {
      const { limit, offset } = validatedQuery!;
      const supabase = createClient({ admin: true });

      const sources: SourceWithRelations[] = await getSourcesQuery(supabase, {
        limit,
        offset,
      });

      return NextResponse.json({
        ok: true,
        sources,
        pagination: {
          limit,
          offset,
          count: sources.length,
        },
      });
    } catch (_e: unknown) {
      return NextResponse.json(
        { ok: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

export const POST = withValidation(
  createSourceSchema,
  undefined, // No query validation for POST
  async (validatedBody) => {
    const { isAdmin } = await getAdminFlag();

    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 403 }
      );
    }

    try {
      const sourceData = validatedBody!;
      const supabase = createClient({ admin: true });

      // Check if this is an update (has id) or create (no id)
      if ('id' in sourceData && sourceData.id) {
        // Update existing source
        const updateData = updateSourceSchema.parse(sourceData);
        const updated = await updateSource(supabase, updateData);

        return NextResponse.json({
          ok: true,
          id: updated?.id ?? updateData.id,
        });
      }
      // Create new source
      const created = await createSource(supabase, sourceData);

      return NextResponse.json({ ok: true, id: created?.id });
    } catch (_e: unknown) {
      return NextResponse.json(
        { ok: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
