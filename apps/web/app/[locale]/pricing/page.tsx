import { env } from '@/env';
import { Button } from '@zeke/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@zeke/design-system/components/ui/card';
import { getDictionary } from '@zeke/internationalization';
import { createMetadata } from '@zeke/seo/metadata';
import { Check, Clock, MoveRight, PhoneCall, Target, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

type PricingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: PricingPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const _dictionary = await getDictionary(locale);

  return createMetadata({
    title: 'Pricing - ZEKE Research Intelligence',
    description:
      'Simple pricing for research that goes from 10 hours to 5 minutes. Start free, upgrade when you need team features.',
  });
};

const Pricing = async ({ params }: PricingPageProps) => {
  const { locale } = await params;
  const _dictionary = await getDictionary(locale);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 py-20 lg:py-40">
          <div className="flex flex-col gap-4 text-center">
            <h1 className="max-w-4xl font-regular text-4xl tracking-tighter md:text-6xl">
              From 10 hours to 5 minutes—
              <span className="text-primary"> for everyone</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed tracking-tight md:text-xl">
              Simple pricing for research intelligence that turns chaos into
              actionable playbooks. Start free, upgrade when you need team
              features.
            </p>
          </div>
        </div>

        {/* Value Props */}
        <div className="py-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Compress Research</h3>
                <p className="text-muted-foreground text-sm">
                  Turn podcasts, papers, and videos into verified 5-minute
                  briefs
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Apply to Goals</h3>
                <p className="text-muted-foreground text-sm">
                  Load your SOPs and get ready-to-use plans and content
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Create with Receipts</h3>
                <p className="text-muted-foreground text-sm">
                  Publish cited content with timestamps and source verification
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Pricing Cards */}
        <div className="py-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Free Tier */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free</CardTitle>
                <p className="text-muted-foreground">
                  Perfect for trying ZEKE's research compression
                </p>
                <div className="mt-4">
                  <span className="font-bold text-4xl">$0</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">5 research briefs per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Basic content analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Citations and timestamps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Export to common formats</span>
                  </li>
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href={env.NEXT_PUBLIC_APP_URL}>
                    Start Free <MoveRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-primary">
              <div className="-top-3 -translate-x-1/2 absolute left-1/2 transform">
                <span className="rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground text-sm">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <p className="text-muted-foreground">
                  For individuals and small teams doing serious research
                </p>
                <div className="mt-4">
                  <span className="font-bold text-4xl">$29</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Unlimited research briefs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      Advanced analysis & insights
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Custom SOPs and playbooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">API access</span>
                  </li>
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href={env.NEXT_PUBLIC_APP_URL}>
                    Start Pro Trial <MoveRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Team Tier */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Team</CardTitle>
                <p className="text-muted-foreground">
                  For teams that need shared playbooks and collaboration
                </p>
                <div className="mt-4">
                  <span className="font-bold text-4xl">$99</span>
                  <span className="text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Up to 10 team members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Shared playbook library</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Team analytics & insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                </ul>
                <Button variant="outline" className="mt-6 w-full" asChild>
                  <Link href="/contact">
                    Contact Sales <PhoneCall className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* FAQ Section */}
        <div className="py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center font-regular text-3xl tracking-tighter md:text-4xl">
              Common Questions
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">
                    How much time will I actually save?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Most users go from 2-10 hours of research per week to 15-30
                    minutes. A 3-hour podcast becomes a 5-minute brief with
                    timestamps to jump to what matters.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">
                    What if I need to verify the insights?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Every claim includes timestamps, quotes, or source snippets.
                    Click any insight to jump to the exact moment in the
                    original content.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">Can I cancel anytime?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes, cancel anytime. You can export all your research briefs
                    and playbooks before your subscription ends.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">
                    Do you offer team discounts?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! Contact us for custom pricing for larger teams or
                    enterprise needs. We also offer academic and nonprofit
                    discounts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="mb-4 font-regular text-2xl tracking-tighter md:text-3xl">
              Ready to compress your research?
            </h3>
            <p className="mb-6 text-muted-foreground">
              Join operators, founders, marketers, and PMs who've made research
              effortless with ZEKE.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href={env.NEXT_PUBLIC_APP_URL}>Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
