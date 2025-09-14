/**
 * Support page with ZEKE branding and value proposition
 */

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
import {
  BookOpen,
  Clock,
  HelpCircle,
  Mail,
  MessageSquare,
  Zap,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

type SupportPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: SupportPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const _dictionary = await getDictionary(locale);

  return createMetadata({
    title: 'Support - ZEKE',
    description:
      "Get help with ZEKE research intelligence platform. From quick questions to team setup, we're here to help you compress research from 10 hours to 5 minutes.",
  });
};

const SupportPage = async ({ params }: SupportPageProps) => {
  const { locale } = await params;
  const _dictionary = await getDictionary(locale);

  const email = 'me@parkerrex.com';
  const supportSubject = encodeURIComponent('ZEKE: Support Request');
  const supportBody = encodeURIComponent(
    "Hi! I need help with ZEKE. Here's my question:"
  );
  const supportMailto = `mailto:${email}?subject=${supportSubject}&body=${supportBody}`;

  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 py-20">
          <div className="flex flex-col gap-4 text-center">
            <h1 className="max-w-4xl font-regular text-4xl tracking-tighter md:text-5xl">
              We're here to help
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed tracking-tight">
              Get the most out of ZEKE's research intelligence platform. From
              quick questions to team setup, our small team is ready to help.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Try the Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground text-sm">
                  See how ZEKE turns a 3-hour podcast into a 5-minute brief with
                  receipts
                </p>
                <Button size="sm" asChild>
                  <Link href={env.NEXT_PUBLIC_APP_URL}>Start Free Demo</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Email Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground text-sm">
                  Get help with your account, billing, or technical questions
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href={supportMailto}>Send Email</a>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Feature Request</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground text-sm">
                  Have an idea to make research even faster? We'd love to hear
                  it
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent('ZEKE: Feature Request')}`}
                  >
                    Share Idea
                  </a>
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

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    How does ZEKE compress 10 hours to 5 minutes?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ZEKE analyzes long-form content (podcasts, papers, videos)
                    and extracts the key insights, claims, and actionable items.
                    Every point is linked to timestamps or source snippets for
                    verification. Instead of listening to a 3-hour podcast, you
                    get a 5-minute brief with the ability to jump to specific
                    moments that matter to your goals.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    What makes ZEKE different from other AI tools?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ZEKE doesn't just summarize—it applies insights to your
                    specific goals and SOPs. We provide "receipts" (timestamps,
                    quotes, citations) for every claim, and we help you create
                    actionable outputs like PRDs, experiment plans, and
                    content—all with proper attribution.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    How quickly do you respond to support requests?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our small team at Minton Holdings LLC typically responds
                    within 1–2 business days. For urgent issues or demo
                    requests, we often respond much faster. For immediate help,
                    try our free demo to see if it answers your questions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="mb-4 font-regular text-2xl tracking-tighter">
              Still have questions?
            </h3>
            <p className="mb-6 text-muted-foreground">
              Whether you're looking to compress your team's research workflow
              or have specific questions about ZEKE's capabilities, we're here
              to help.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <a href={supportMailto}>Email Support</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
