import { withAuthAndRateLimit } from '@/lib/rate-limit/api-rate-limit';
import {
  adminQuerySchema,
  createSourceSchema,
  updateSourceSchema,
  withValidation,
} from '@/lib/validation/api-schemas';
import { supabaseAdminClient } from '@zeke/supabase/admin';
import { NextResponse } from 'next/server';

// Types are now defined in validation schemas

export const GET = withAuthAndRateLimit(
  'admin',
  'admin',
  withValidation(
    undefined, // No body validation for GET
    adminQuerySchema,
    async (_validatedBody, validatedQuery) => {
      try {
        const { limit, offset } = validatedQuery!;

        const { data, error } = await supabaseAdminClient
          .from('sources')
          .select(
            'id, kind, name, url, domain, active, last_checked, metadata, source_metrics:source_metrics(*), source_health:source_health(*)'
          )
          .order('updated_at', { ascending: false, nullsFirst: true })
          .range(offset, offset + (limit || 50) - 1);

        if (error) {
          return NextResponse.json(
            { ok: false, error: 'Failed to fetch sources' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: true,
          sources: data ?? [],
          pagination: {
            limit,
            offset,
            count: data?.length ?? 0,
          },
        });
      } catch (_e: unknown) {
        return NextResponse.json(
          { ok: false, error: 'Internal server error' },
          { status: 500 }
        );
      }
    }
  )
);

export const POST = withAuthAndRateLimit(
  'admin',
  'admin',
  withValidation(
    createSourceSchema,
    undefined, // No query validation for POST
    async (validatedBody) => {
      try {
        const sourceData = validatedBody!;

        // Check if this is an update (has id) or create (no id)
        if ('id' in sourceData && sourceData.id) {
          // Update existing source
          const updateData = updateSourceSchema.parse(sourceData);
          const { id, ...updateFields } = updateData;

          const { data: upd, error } = await supabaseAdminClient
            .from('sources')
            .update({
              ...updateFields,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('id')
            .maybeSingle();

          if (error) {
            return NextResponse.json(
              { ok: false, error: 'Failed to update source' },
              { status: 500 }
            );
          }

          return NextResponse.json({ ok: true, id: upd?.id ?? id });
        }
        // Create new source
        const { data: ins, error } = await supabaseAdminClient
          .from('sources')
          .insert([sourceData])
          .select('id')
          .maybeSingle();

        if (error) {
          return NextResponse.json(
            { ok: false, error: 'Failed to create source' },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true, id: ins?.id });
      } catch (_e: unknown) {
        return NextResponse.json(
          { ok: false, error: 'Internal server error' },
          { status: 500 }
        );
      }
    }
  )
);
