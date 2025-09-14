import { upsertUserSubscription } from '@/actions/account/upsert-user-subscription';
import { stripeAdmin } from '@/lib/stripe/stripe-admin';
import { getEnvVar } from '@/utils/get-env-var';
import {
  softDeleteProduct,
  upsertPrice,
  upsertProduct,
} from '@zeke/supabase/mutations';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
  'product.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = getEnvVar(
    process.env.STRIPE_WEBHOOK_SECRET,
    'STRIPE_WEBHOOK_SECRET'
  );
  let event: Stripe.Event;

  try {
    if (!sig) {
      return Response.json('Missing stripe-signature header', { status: 400 });
    }
    event = stripeAdmin.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error: unknown) {
    const { safeErrorMessage } = await import('@/utils/errors');
    return Response.json(`Webhook Error: ${safeErrorMessage(error)}`, {
      status: 400,
    });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          await upsertProduct(event.data.object as Stripe.Product);
          break;
        case 'product.deleted': {
          // Stripe sends a DeletedProduct object with { id, deleted: true }
          const deleted = event.data.object as { id: string };
          await softDeleteProduct(deleted.id);
          break;
        }
        case 'price.created':
        case 'price.updated': {
          const price = event.data.object as Stripe.Price;
          await ensureProductThenUpsertPrice(price);
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await upsertUserSubscription({
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            isCreateAction: false,
          });
          break;
        }
        case 'checkout.session.completed': {
          const checkoutSession = event.data.object as Stripe.Checkout.Session;

          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;
            await upsertUserSubscription({
              subscriptionId: subscriptionId as string,
              customerId: checkoutSession.customer as string,
              isCreateAction: true,
            });
          }
          break;
        }
        default:
          throw new Error('Unhandled relevant event!');
      }
    } catch (error: unknown) {
      const { safeErrorMessage } = await import('@/utils/errors');
      return Response.json(
        `Webhook handler failed: ${safeErrorMessage(error)}`,
        {
          status: 400,
        }
      );
    }
  }
  return Response.json({ received: true });
}

function isForeignKeyViolation(error: unknown): boolean {
  const anyErr = error as any;
  const code = anyErr?.code ?? anyErr?.data?.code;
  const message: string | undefined =
    anyErr?.message ?? anyErr?.error ?? anyErr?.data?.message;
  // Postgres FK violation code is 23503; PostgREST often returns 409 with this code.
  if (code === '23503') {
    return true;
  }
  if (
    typeof message === 'string' &&
    /foreign key|violates foreign key/i.test(message)
  ) {
    return true;
  }
  return false;
}

async function ensureProductThenUpsertPrice(price: Stripe.Price) {
  try {
    await upsertPrice(price);
    return;
  } catch (err) {
    if (!isForeignKeyViolation(err)) {
      throw err;
    }
  }

  // If we get here, we likely tried to upsert a price whose product doesn't exist yet.
  const productId =
    typeof price.product === 'string' ? price.product : price.product.id;
  const product = await stripeAdmin.products.retrieve(productId);
  await upsertProduct(product);
  // Retry once after ensuring the product row exists
  await upsertPrice(price);
}
