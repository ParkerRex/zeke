import { stripeAdmin } from '@/lib/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';
import { getCustomerId } from '@api/supabase/queries/account/get-customer-id';
import { getSession } from '@api/supabase/queries/account/get-session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Get the user from session
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Could not get userId');
  }

  // 2. Retrieve or create the customer in Stripe
  const customer = await getCustomerId({
    userId: session.user.id,
  });

  if (!customer) {
    throw new Error('Could not get customer');
  }

  // 3. Create portal link and redirect user
  const { url } = await stripeAdmin.billingPortal.sessions.create({
    customer,
    return_url: `${getURL()}/account`,
  });

  redirect(url);
}
