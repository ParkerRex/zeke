'use server';

import { supabaseAdminClient } from '@zeke/supabase/admin';
import type Stripe from 'stripe';
import type { Database } from '@zeke/supabase/types';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export async function upsertUserSubscription(subscription: Stripe.Subscription): Promise<void> {
  const subscriptionData: Subscription = {
    id: subscription.id,
    user_id: subscription.metadata.userId,
    status: subscription.status,
    metadata: subscription.metadata,
    price_id: subscription.items.data[0]?.price.id ?? null,
    quantity: subscription.items.data[0]?.quantity ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    created: new Date(subscription.created * 1000).toISOString(),
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  };

  const { error } = await supabaseAdminClient
    .from('subscriptions')
    .upsert([subscriptionData]);
  
  if (error) {
    throw error;
  }
}
