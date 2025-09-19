import { requireAdmin } from '@/utils/admin';
import { fetchPipelineCounts, fetchWorkerStatus } from '@/utils/pipeline';
import { ForbiddenError, UnauthorizedError } from '@/utils/errors';
import { NextResponse } from 'next/server';

export async function GET(): Promise<Response> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { ok: false, error: 'forbidden' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }

  try {
    const [worker, counts] = await Promise.all([
      fetchWorkerStatus(),
      fetchPipelineCounts(),
    ]);

    return NextResponse.json({
      ok: true,
      worker,
      counts: {
        raw_items: counts.rawItems,
        contents: counts.contents,
        stories: counts.stories,
      },
      ts: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: HTTP_INTERNAL_SERVER_ERROR }
    );
  }
}
