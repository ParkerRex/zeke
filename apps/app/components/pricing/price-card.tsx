"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IoCheckmark } from "react-icons/io5";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  BillingInterval,
  Price,
  ProductWithPrices,
} from "@/types/pricing";
import { productMetadataSchema } from "@/types/pricing/product-metadata";

const CENTS_PER_DOLLAR = 100;

export function PricingCard({
  product,
  price,
  createCheckoutAction,
}: {
  product: ProductWithPrices;
  price?: Price;
  createCheckoutAction?: ({ price }: { price: Price }) => void;
}) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    price ? (price.interval as BillingInterval) : "month"
  );
  const currentPrice = useMemo(() => {
    if (price) {
      return price;
    }
    if (product.prices.length === 0) {
      return null;
    }
    if (product.prices.length === 1) {
      return product.prices[0];
    }
    return product.prices.find((p) => p.interval === billingInterval);
  }, [billingInterval, price, product.prices]);

  const monthPrice = product.prices.find(
    (p) => p.interval === "month"
  )?.unit_amount;
  const yearPrice = product.prices.find(
    (p) => p.interval === "year"
  )?.unit_amount;
  const isBillingIntervalYearly = billingInterval === "year";
  const metadata = productMetadataSchema.parse(product.metadata);
  const buttonVariantMap = { pro: "default" } as const;

  function handleBillingIntervalChange(interval: BillingInterval) {
    setBillingInterval(interval);
  }

  return (
    <WithSexyBorder className="w-full">
      <div className="flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="text-center">
          <div className="mb-2 font-alt font-bold text-2xl text-gray-900">
            {product.name}
          </div>
          {!price && product.prices.length > 1 && (
            <div className="mb-3">
              <PricingSwitch onChange={handleBillingIntervalChange} />
            </div>
          )}
          <div className="mb-6 flex items-end justify-center gap-2 text-gray-900">
            <span className="font-extrabold text-5xl tracking-tight">
              {(() => {
                if (yearPrice && isBillingIntervalYearly) {
                  return `$${yearPrice / CENTS_PER_DOLLAR}`;
                }
                if (monthPrice) {
                  return `$${monthPrice / CENTS_PER_DOLLAR}`;
                }
                return "Custom";
              })()}
            </span>
            <span className="pb-2 text-gray-500 text-sm">
              {(() => {
                if (yearPrice && isBillingIntervalYearly) {
                  return "/year";
                }
                if (monthPrice) {
                  return "/month";
                }
                return null;
              })()}
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xs flex-1 space-y-3 py-2">
          <CheckItem text={"Unlimited research"} />
          <CheckItem text={`${metadata.supportLevel} support`} />
        </div>

        {createCheckoutAction && (
          <div className="mt-6">
            {currentPrice && (
              <Button
                className="w-full"
                onClick={() => createCheckoutAction({ price: currentPrice })}
                variant={buttonVariantMap[metadata.priceCardVariant]}
              >
                Get Started
              </Button>
            )}
            {!currentPrice && (
              <Button
                asChild
                className="w-full"
                variant={buttonVariantMap[metadata.priceCardVariant]}
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </WithSexyBorder>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <IoCheckmark className="my-auto flex-shrink-0 text-emerald-600 text-lg" />
      <p className="font-medium text-gray-700 text-sm first-letter:capitalize">
        {text}
      </p>
    </div>
  );
}

export function WithSexyBorder({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className}>{children}</div>;
}

function PricingSwitch({
  onChange,
}: {
  onChange: (value: BillingInterval) => void;
}) {
  return (
    <Tabs
      className="flex items-center"
      defaultValue="month"
      onValueChange={(newBillingInterval) =>
        onChange(newBillingInterval as BillingInterval)
      }
    >
      <TabsList className="m-auto">
        <TabsTrigger value="month">Monthly</TabsTrigger>
        <TabsTrigger value="year">Yearly</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
