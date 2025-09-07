import { getSession } from "@db/queries/account/get-session";
import { getSubscription } from "@db/queries/account/get-subscription";
import { getProducts } from "@db/queries/pricing/get-products";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { PropsWithChildren, ReactNode } from "react";
import { PricingCard } from "@/components/pricing/price-card";
import { Button } from "@/components/ui/button";
import type { Price, ProductWithPrices } from "@/types/pricing";

export default async function AccountPage() {
  const [session, subscription, products] = await Promise.all([
    getSession(),
    getSubscription(),
    getProducts(),
  ]);

  if (!session) {
    redirect("/login");
  }

  let userProduct: ProductWithPrices | undefined;
  let userPrice: Price | undefined;

  if (subscription) {
    for (const product of products) {
      for (const price of product.prices) {
        if (price.id === subscription.price_id) {
          userProduct = product;
          userPrice = price;
        }
      }
    }
  }

  return (
    <section className="rounded-lg bg-white px-4 py-16">
      <h1 className="mb-8 text-center">Account</h1>

      <div className="flex flex-col gap-4">
        <Card
          footer={
            subscription ? (
              <Button asChild size="sm" variant="secondary">
                <Link href="/manage-subscription">
                  Manage your subscription
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="secondary">
                <Link href="/pricing">Start a subscription</Link>
              </Button>
            )
          }
          title="Your Plan"
        >
          {userProduct && userPrice ? (
            <PricingCard price={userPrice} product={userProduct} />
          ) : (
            <p>You don&apos;t have an active subscription</p>
          )}
        </Card>
      </div>
    </section>
  );
}

function Card({
  title,
  footer,
  children,
}: PropsWithChildren<{
  title: string;
  footer?: ReactNode;
}>) {
  return (
    <div className="m-auto w-full max-w-3xl rounded-md bg-gray-100">
      <div className="p-4">
        <h2 className="mb-1 font-semibold text-xl">{title}</h2>
        <div className="py-4">{children}</div>
      </div>
      <div className="flex justify-end rounded-b-md border-gray-200 border-t p-4">
        {footer}
      </div>
    </div>
  );
}
