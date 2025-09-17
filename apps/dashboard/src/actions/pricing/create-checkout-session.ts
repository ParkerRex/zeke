'use server';
import { stripeAdmin } from '@/src/utils/stripe-admin';
import { getURL } from '@/src/utils/get-url';
import { getSession } from '@zeke/supabase/queries';
import type { Price } from '@zeke/supabase/types';
import { redirect } from 'next/navigation';
import { getOrCreateCustomer } from '../account/get-or-create-customer';

export async function createCheckoutSession({ price }: { price: Price }) {
  const session = await getSession();
  if (!session?.user) {
    return redirect(`${getURL()}/signup`);
  }
  if (!session.user.email) {
    throw new Error('Could not get email');
  }

  const customer = await getOrCreateCustomer({
    userId: session.user.id,
    email: session.user.email,
  });
  const checkoutSession = await stripeAdmin.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer,
    customer_update: { address: 'auto' },
    line_items: [{ price: price.id, quantity: 1 }],
    mode: price.type === 'recurring' ? 'subscription' : 'payment',
    allow_promotion_codes: true,
    success_url: `${getURL()}/home`,
    cancel_url: `${getURL()}/`,
  });
  if (!checkoutSession?.url) {
    throw new Error('checkoutSession is not defined');
  }
  redirect(checkoutSession.url);
}
