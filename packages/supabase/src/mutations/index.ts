import type Stripe from 'stripe';
import type { Database } from '../types/db';
import type { Client } from "../types";
type Product = Database['public']['Tables']['products']['Row'];
type SourceRow = Database['public']['Tables']['sources']['Row'];

export type CreateSourceParams = Pick<
  SourceRow,
  'kind' | 'name' | 'url' | 'domain' | 'metadata' | 'active'
>;

export type UpdateSourceParams = {
  id: SourceRow['id'];
} & Partial<
  Pick<SourceRow, 'kind' | 'name' | 'url' | 'domain' | 'metadata' | 'active'>
>;

const normalizeOptionalField = <T>(
  value: T | null | undefined,
): T | null => (value === undefined ? null : value);

export async function createSource(
  supabase: Client,
  payload: CreateSourceParams,
) {
  const insertData: Partial<SourceRow> = {
    kind: payload.kind,
    name: normalizeOptionalField(payload.name),
    url: normalizeOptionalField(payload.url),
    domain: normalizeOptionalField(payload.domain),
    metadata: normalizeOptionalField(payload.metadata),
    active: payload.active ?? true,
  };

  const { data } = await supabase
    .from('sources')
    .insert([insertData])
    .select('id')
    .maybeSingle()
    .throwOnError();

  return data;
}

export async function updateSource(
  supabase: Client,
  payload: UpdateSourceParams,
) {
  const { id, ...fields } = payload;
  const updateData: Partial<SourceRow> = {
    updated_at: new Date().toISOString(),
  };

  if (fields.kind !== undefined) {
    updateData.kind = fields.kind;
  }
  if (fields.name !== undefined) {
    updateData.name = normalizeOptionalField(fields.name);
  }
  if (fields.url !== undefined) {
    updateData.url = normalizeOptionalField(fields.url);
  }
  if (fields.domain !== undefined) {
    updateData.domain = normalizeOptionalField(fields.domain);
  }
  if (fields.metadata !== undefined) {
    updateData.metadata = normalizeOptionalField(fields.metadata);
  }
  if (fields.active !== undefined) {
    updateData.active = fields.active;
  }

  const { data } = await supabase
    .from('sources')
    .update(updateData)
    .eq('id', id)
    .select('id')
    .maybeSingle()
    .throwOnError();

  return data;
}

export async function updateUser(supabase: Client, data: any) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return;
  }

  return supabase
    .from("users")
    .update(data)
    .eq("id", session.user.id)
    .select()
    .single();
}


export async function deleteUser(supabase: Client) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return;
  }

  await Promise.all([
    supabase.auth.admin.deleteUser(session.user.id),
    supabase.from("users").delete().eq("id", session.user.id),
    supabase.auth.signOut(),
  ]);

  return session.user.id;
}


export async function softDeleteProduct(productId: string): Promise<void> {
  const { error: pricesError } = await supabaseAdminClient
    .from('prices')
    .update({ active: false })
    .eq('product_id', productId);
  if (pricesError) {
    throw pricesError;
  }

  const { error: productError } = await supabaseAdminClient
    .from('products')
    .update({ active: false })
    .eq('id', productId);
  if (productError) {
    throw productError;
  }

  // Product soft-deactivated: ${productId}
}

type Price = Database['public']['Tables']['prices']['Row'];

export async function upsertPrice(price: Stripe.Price): Promise<void> {
  const priceData: Price = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : null,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };

  const { error } = await supabaseAdminClient
    .from('prices')
    .upsert([priceData]);
  if (error) {
    throw error;
  }
}

export async function upsertProduct(product: Stripe.Product): Promise<void> {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  const { error } = await supabaseAdminClient
    .from('products')
    .upsert([productData]);
  if (error) {
    throw error;
  }
}
