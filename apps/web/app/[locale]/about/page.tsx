/**
 * About page showcasing ZEKE's mission and founder story
 */

import { Button } from '@zeke/design-system/components/ui/button';
import { Card, CardContent } from '@zeke/design-system/components/ui/card';
import { getDictionary } from '@zeke/internationalization';
import { createMetadata } from '@zeke/seo/metadata';
import type { Metadata } from 'next';
import { Clock, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { env } from '@/env';

type AboutPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: AboutPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createMetadata({
    title: 'About ZEKE - From 10 Hours to 5 Minutes',
    description: 'Learn how ZEKE turns research chaos into actionable playbooks, helping teams compress 10 hours of research into 5 minutes of verified insights.',
  });
};

const AboutPage = async ({ params }: AboutPageProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 py-20 lg:py-40">
          <div className="flex flex-col gap-4 text-center">
            <h1 className="max-w-4xl font-regular text-4xl tracking-tighter md:text-6xl">
              From 10 hours to 5 minutes—
              <span className="text-primary"> without missing what matters</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed tracking-tight md:text-xl">
              ZEKE makes research effortless—turn sprawling content into verified insights 
              and ready‑to‑use outputs, fast.
            </p>
          </div>
        </div>

        {/* Value Props */}
        <div className="py-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">10 hours → 5 minutes</h3>
                <p className="text-muted-foreground">
                  Turn long podcasts, papers, videos, and posts into verified, 
                  role‑aware briefs with receipts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Find what matters</h3>
                <p className="text-muted-foreground">
                  Sift across sources you'd only reach if you had a full‑time researcher. 
                  Get the signal, not the noise.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Apply instantly</h3>
                <p className="text-muted-foreground">
                  Load your goals and SOPs. Turn insights into ready‑to‑use plans, 
                  prompts, briefs, and content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Founder Story */}
        <div className="py-20">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-8">
              <div className="text-center">
                <h2 className="font-regular text-3xl tracking-tighter md:text-5xl">
                  Why we're building ZEKE
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  From our founder's journey hunting for the edge
                </p>
              </div>
              
              <Card className="bg-muted/50">
                <CardContent className="p-8">
                  <blockquote className="text-lg leading-relaxed">
                    <p className="mb-4">
                      "I was always hunting for the edge: 10 YouTube videos a week, consulting to pay bills, 
                      building a community of engineers just to keep up. It was impossible to track everything, 
                      so I got good at defining SOPs and leveraging AI. I sold automation as a service and built agents for people.
                    </p>
                    <p>
                      Now I'm automating the thing I had to do manually—
                      <strong className="text-foreground"> turning chaos into playbooks</strong> so any business can actually leverage this stuff."
                    </p>
                  </blockquote>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 font-regular text-3xl tracking-tighter md:text-4xl">
              Our mission
            </h2>
            <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
              Give everyone pro‑level research & applied‑AI skills. We're not selling a "copilot"—
              we're selling <strong className="text-foreground">outcomes</strong>: clarity, speed, and publish‑ready work.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href={env.NEXT_PUBLIC_APP_URL}>
                  Try ZEKE free
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  Get in touch
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
