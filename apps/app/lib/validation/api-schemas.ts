import { z } from 'zod';

// Common validation patterns
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long');
export const domainSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    'Invalid domain format'
  )
  .max(253, 'Domain too long');

// Source validation schemas
export const sourceKindSchema = z.enum(
  [
    'rss',
    'youtube_channel',
    'youtube_search',
    'reddit',
    'hn',
    'arxiv',
    'podcast',
  ],
  { errorMap: () => ({ message: 'Invalid source kind' }) }
);

export const sourceMetadataSchema = z.record(z.unknown()).optional();

export const createSourceSchema = z
  .object({
    kind: sourceKindSchema,
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name too long')
      .optional(),
    url: urlSchema.optional(),
    domain: domainSchema.optional(),
    metadata: sourceMetadataSchema,
    active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // YouTube search sources don't need URLs
      if (data.kind === 'youtube_search') {
        return true;
      }
      // All other sources require URLs
      return data.url !== undefined;
    },
    {
      message: 'URL is required for this source type',
      path: ['url'],
    }
  );

export const updateSourceSchema = z.object({
  id: uuidSchema,
  kind: sourceKindSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .optional(),
  url: urlSchema.optional(),
  domain: domainSchema.optional(),
  metadata: sourceMetadataSchema,
  active: z.boolean().optional(),
});

// Pipeline validation schemas
export const triggerPipelineSchema = z.object({
  kind: z
    .enum(['rss', 'youtube'], {
      errorMap: () => ({ message: 'Invalid pipeline kind' }),
    })
    .default('rss'),
});

// Ingest validation schemas
export const oneoffIngestSchema = z.object({
  urls: z
    .array(urlSchema)
    .min(1, 'At least one URL is required')
    .max(50, 'Too many URLs (max 50)'),
});

// Share validation schemas
export const shareRequestSchema = z.object({
  storyId: uuidSchema,
  title: z.string().max(255, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
});

// Query parameter schemas
export const storyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  kind: z
    .enum(['all', 'youtube', 'arxiv', 'podcast', 'reddit', 'hn', 'article'])
    .default('all'),
  q: z.string().max(255, 'Query too long').optional(),
});

export const adminQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Webhook validation (for Stripe)
export const stripeWebhookSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
  created: z.number(),
  livemode: z.boolean(),
});

// Validation helper functions
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const result = schema.safeParse(body);
    if (result.success) {
      return { success: true, data: result.data };
    }

    const errors = result.error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    return { success: false, errors };
  } catch (_error) {
    return { success: false, errors: ['Validation failed'] };
  }
}

export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const result = schema.safeParse(params);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errors = result.error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    return { success: false, errors };
  } catch (_error) {
    return { success: false, errors: ['Query validation failed'] };
  }
}

// Higher-order function for validated API routes
export function withValidation<TBody, TQuery, TArgs extends any[]>(
  bodySchema?: z.ZodSchema<TBody>,
  querySchema?: z.ZodSchema<TQuery>,
  handler?: (
    validatedBody: TBody | undefined,
    validatedQuery: TQuery | undefined,
    ...args: TArgs
  ) => Promise<Response>
) {
  return async (...args: TArgs): Promise<Response> => {
    const request = args.find((arg) => arg instanceof Request) as Request;

    if (!request || !handler) {
      return new Response('Invalid request', { status: 400 });
    }

    let validatedBody: TBody | undefined;
    let validatedQuery: TQuery | undefined;

    // Validate body if schema provided
    if (bodySchema) {
      try {
        const body = await request.json();
        const bodyValidation = validateBody(bodySchema, body);

        if (!bodyValidation.success) {
          return new Response(
            JSON.stringify({
              error: 'Validation failed',
              details: bodyValidation.errors,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        validatedBody = bodyValidation.data;
      } catch (_error) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate query parameters if schema provided
    if (querySchema) {
      const url = new URL(request.url);
      const queryValidation = validateQuery(querySchema, url.searchParams);

      if (!queryValidation.success) {
        return new Response(
          JSON.stringify({
            error: 'Invalid query parameters',
            details: queryValidation.errors,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      validatedQuery = queryValidation.data;
    }

    return handler(validatedBody, validatedQuery, ...args);
  };
}
