import { createCheckoutSession } from '@/src/actions/pricing/create-checkout-session';
import { getProducts } from '@zeke/supabase/queries';
import Image from 'next/image';
import { PricingCard } from './price-card';

export async function PricingSection({
  isPricingPage,
}: {
  isPricingPage?: boolean;
}) {
  const products = await getProducts();
  const HeadingLevel = isPricingPage ? 'h1' : 'h2';
  return (
    <section className="relative overflow-hidden rounded-lg bg-white">
      <div className="relative h-[180px] sm:h-[220px] lg:h-[300px]">
        <Image
          alt=""
          className="rounded-t-lg object-cover"
          fill
          priority={isPricingPage}
          quality={100}
          src="/section-bg.png"
        />
      </div>
      <div className="relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 py-8">
        <HeadingLevel className="max-w-4xl bg-gradient-to-br from-black to-gray-800 bg-clip-text text-center font-bold text-4xl text-transparent lg:text-6xl">
          Predictable pricing for every use case.
        </HeadingLevel>
        <p className="text-center text-xl">
          Find a plan that fits you. Upgrade at any time to enable additional
          features.
        </p>
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <PricingCard
              createCheckoutAction={createCheckoutSession}
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
