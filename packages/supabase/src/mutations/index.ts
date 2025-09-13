import type Stripe from 'stripe';
import { supabaseAdminClient } from '../clients/admin';
import type { Database } from '../types/db';
type Product = Database['public']['Tables']['products']['Row'];

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
