import { PricingCard } from '@/app/components/pricing/price-card';
import ThemeSelector from '@/app/components/theme-selector';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@zeke/design-system/components/ui/avatar';
import { Button } from '@zeke/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@zeke/design-system/components/ui/card';
import {
  getProducts,
  getSession,
  getSubscription,
} from '@zeke/supabase/queries';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Account • ZEKE',
  description: 'Manage your profile, subscription, and preferences',
};

type UserMetadata = {
  avatar_url?: string;
  picture?: string;
};

export default async function AccountPage() {
  const [session, subscription, products] = await Promise.all([
    getSession(),
    getSubscription(),
    getProducts(),
  ]);

  if (!session) {
    redirect('/login');
  }

  // Resolve current product/price
  const userProduct = subscription
    ? products.find((product) =>
        product.prices.some((price) => price.id === subscription.price_id)
      )
    : undefined;
  const userPrice = userProduct?.prices.find(
    (price) => price.id === subscription?.price_id
  );

  const email = session.user?.email;
  const userMetadata = (session.user as { user_metadata?: UserMetadata })
    ?.user_metadata;
  const avatarUrl = userMetadata?.avatar_url ?? userMetadata?.picture;
  const initial = email?.[0]?.toUpperCase() ?? '';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 lg:py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Account</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage your profile, subscription, and preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <section id="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-14 w-14">
                  {avatarUrl && (
                    <AvatarImage alt={email ?? 'Account'} src={avatarUrl} />
                  )}
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{email ?? 'Unknown user'}</div>
                  <div className="text-muted-foreground text-sm">
                    Email address
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Subscription */}
        <section id="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current plan and billing</CardDescription>
            </CardHeader>
            <CardContent>
              {userProduct && userPrice ? (
                <PricingCard price={userPrice} product={userProduct} />
              ) : (
                <p className="text-sm">
                  You don&apos;t have an active subscription.
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button asChild size="sm" variant="secondary">
                <Link href={subscription ? '/manage-subscription' : '/pricing'}>
                  {subscription
                    ? 'Manage your subscription'
                    : 'Start a subscription'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* Preferences */}
        <section id="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Theme and appearance</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
