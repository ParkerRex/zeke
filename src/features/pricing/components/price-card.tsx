'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { IoCheckmark } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { productMetadataSchema } from '../models/product-metadata';
import { BillingInterval, Price, ProductWithPrices } from '../types';

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
    price ? (price.interval as BillingInterval) : 'month'
  );

  // Determine the price to render
  const currentPrice = useMemo(() => {
    // If price is passed in we use that one. This is used on the account page when showing the user their current subscription.
    if (price) return price;

    // If no price provided we need to find the right one to render for the product.
    // First check if the product has a price - in the case of our enterprise product, no price is included.
    // We'll return null and handle that case when rendering.
    if (product.prices.length === 0) return null;

    // Next determine if the product is a one time purchase - in these cases it will only have a single price.
    if (product.prices.length === 1) return product.prices[0];

    // Lastly we can assume the product is a subscription one with a month and year price, so we get the price according to the select billingInterval
    return product.prices.find((price) => price.interval === billingInterval);
  }, [billingInterval, price, product.prices]);

  const monthPrice = product.prices.find((price) => price.interval === 'month')?.unit_amount;
  const yearPrice = product.prices.find((price) => price.interval === 'year')?.unit_amount;
  const isBillingIntervalYearly = billingInterval === 'year';
  const metadata = productMetadataSchema.parse(product.metadata);
  const buttonVariantMap = {
    pro: 'default',
  } as const;

  function handleBillingIntervalChange(billingInterval: BillingInterval) {
    setBillingInterval(billingInterval);
  }

  return (
    <WithSexyBorder className='w-full'>
      <div className='flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm'>
        <div className='text-center'>
          <div className='mb-2 font-alt text-2xl font-bold text-gray-900'>{product.name}</div>
          {!Boolean(price) && product.prices.length > 1 && (
            <div className='mb-3'>
              <PricingSwitch onChange={handleBillingIntervalChange} />
            </div>
          )}
          <div className='mb-6 flex items-end justify-center gap-2 text-gray-900'>
            <span className='text-5xl font-extrabold tracking-tight'>
              {yearPrice && isBillingIntervalYearly
                ? '$' + yearPrice / 100
                : monthPrice
                ? '$' + monthPrice / 100
                : 'Custom'}
            </span>
            <span className='pb-2 text-sm text-gray-500'>
              {yearPrice && isBillingIntervalYearly ? '/year' : monthPrice ? '/month' : null}
            </span>
          </div>
        </div>

        <div className='mx-auto w-full max-w-xs flex-1 space-y-3 py-2'>
          {metadata.researches === 'unlimited' ? (
            <CheckItem text={`Unlimited research`} />
          ) : (
            <CheckItem text={`Up to ${metadata.researches} researches`} />
          )}
          <CheckItem text={`${metadata.supportLevel} support`} />
        </div>

        {createCheckoutAction && (
          <div className='mt-6'>
            {currentPrice && (
              <Button
                variant={buttonVariantMap[metadata.priceCardVariant]}
                className='w-full'
                onClick={() => createCheckoutAction({ price: currentPrice })}
              >
                Get Started
              </Button>
            )}
            {!currentPrice && (
              <Button variant={buttonVariantMap[metadata.priceCardVariant]} className='w-full' asChild>
                <Link href='/contact'>Contact Us</Link>
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
    <div className='flex items-center gap-3'>
      <IoCheckmark className='my-auto flex-shrink-0 text-emerald-600 text-lg' />
      <p className='text-sm font-medium text-gray-700 first-letter:capitalize'>{text}</p>
    </div>
  );
}

export function WithSexyBorder({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

function PricingSwitch({ onChange }: { onChange: (value: BillingInterval) => void }) {
  return (
    <Tabs
      defaultValue='month'
      className='flex items-center'
      onValueChange={(newBillingInterval) => onChange(newBillingInterval as BillingInterval)}
    >
      <TabsList className='m-auto'>
        <TabsTrigger value='month'>Monthly</TabsTrigger>
        <TabsTrigger value='year'>Yearly</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
