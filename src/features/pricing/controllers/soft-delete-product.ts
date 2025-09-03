import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * Soft-delete a product by setting `active=false` on the product and all its prices.
 * This avoids foreign key issues and keeps historical references intact.
 */
export async function softDeleteProduct(productId: string) {
  // Deactivate prices for this product first
  const { error: pricesError } = await supabaseAdminClient
    .from('prices')
    .update({ active: false })
    .eq('product_id', productId);

  if (pricesError) throw pricesError;

  // Deactivate the product
  const { error: productError } = await supabaseAdminClient
    .from('products')
    .update({ active: false })
    .eq('id', productId);

  if (productError) throw productError;

  console.info(`Product soft-deactivated: ${productId}`);
}
