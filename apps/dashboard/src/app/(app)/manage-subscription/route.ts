import { stripeAdmin } from '@/src/utils/stripe-admin';
import { getURL } from '@/src/utils/get-url';
import { getCustomerIdQuery, getSession } from '@zeke/supabase/queries';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Get the user from session
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Could not get userId');
  }

  // 2. Retrieve or create the customer in Stripe
  const customerResult = await getCustomerIdQuery({
    userId: session.user.id,
  });

  if (!customerResult.success) {
    throw new Error(customerResult.error || 'Could not get customer');
  }

  const customer = customerResult.data;

  // 3. Create portal link and redirect user
  const { url } = await stripeAdmin.billingPortal.sessions.create({
    customer,
    return_url: `${getURL()}/account`,
  });

  redirect(url);
}
