'use server';

import type { Database } from '@zeke/supabase/types';
import type Stripe from 'stripe';
import { updateUserSubscription } from '@/lib/database/transaction-helpers';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export async function upsertUserSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;

  if (!userId) {
    throw new Error('User ID not found in subscription metadata');
  }

  const result = await updateUserSubscription(userId, {
    subscription_id: subscription.id,
    status: subscription.status,
    price_id: subscription.items.data[0]?.price.id,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to update user subscription');
  }
}

// Legacy function signature for backward compatibility
export async function upsertUserSubscriptionLegacy(params: {
  subscriptionId: string;
  customerId: string;
  isCreateAction: boolean;
}): Promise<void> {
  // This would need to fetch the subscription from Stripe first
  // For now, we'll throw an error to indicate this needs to be updated
  throw new Error('Legacy upsertUserSubscription called - please update to use Stripe.Subscription object');
}
