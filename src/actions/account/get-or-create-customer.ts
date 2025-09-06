import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }) {
  const { data, error } = await supabaseAdminClient
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error || !data?.stripe_customer_id) {
    const customer = await stripeAdmin.customers.create({
      email,
      metadata: { userId },
    });
    const { error: supabaseError } = await supabaseAdminClient
      .from('customers')
      .insert([{ id: userId, stripe_customer_id: customer.id }]);
    if (supabaseError) throw supabaseError;
    return customer.id;
  }

  return data.stripe_customer_id as string;
}

