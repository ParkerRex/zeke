import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function softDeleteProduct(productId: string) {
  const { error: pricesError } = await supabaseAdminClient
    .from('prices')
    .update({ active: false })
    .eq('product_id', productId);
  if (pricesError) throw pricesError;

  const { error: productError } = await supabaseAdminClient
    .from('products')
    .update({ active: false })
    .eq('id', productId);
  if (productError) throw productError;

  console.info(`Product soft-deactivated: ${productId}`);
}

