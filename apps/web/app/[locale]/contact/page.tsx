import { Button } from '@zeke/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@zeke/design-system/components/ui/card';
import { Input } from '@zeke/design-system/components/ui/input';
import { Label } from '@zeke/design-system/components/ui/label';
import { Textarea } from '@zeke/design-system/components/ui/textarea';
import { getDictionary } from '@zeke/internationalization';
import { createMetadata } from '@zeke/seo/metadata';
import type { Metadata } from 'next';
import { Clock, Mail, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import { env } from '@/env';

type ContactProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: ContactProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createMetadata({
    title: 'Contact ZEKE - Get Research Done in Minutes',
    description: 'Ready to compress 10 hours of research into 5 minutes? Get in touch with our team to see how ZEKE can transform your research workflow.',
  });
};

const Contact = async ({ params }: ContactProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  const email = "me@parkerrex.com";
  const subject = encodeURIComponent("ZEKE: Research Demo Request");
  const body = encodeURIComponent(
    "Hi! I'm interested in seeing how ZEKE can help compress our research workflow from hours to minutes. I'd like to:"
  );
  const mailto = `mailto:${email}?subject=${subject}&body=${body}`;

  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-8 py-20 lg:py-40">
          <div className="flex flex-col gap-4 text-center">
            <h1 className="max-w-4xl font-regular text-4xl tracking-tighter md:text-6xl">
              Ready to turn 10 hours into
              <span className="text-primary"> 5 minutes</span>?
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed tracking-tight md:text-xl">
              Get in touch to see how ZEKE transforms research chaos into actionable playbooks
              for operators, founders, marketers, and PMs.
            </p>
          </div>
        </div>

        {/* Contact Options */}
        <div className="py-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Quick Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  See ZEKE turn a 3-hour podcast into a 5-minute brief with receipts
                </p>
                <Button size="sm" asChild>
                  <Link href={env.NEXT_PUBLIC_APP_URL}>
                    Try Free Demo
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Team Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Custom SOPs and playbooks for your team's research workflow
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href={mailto}>
                    Contact Sales
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Quick Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Have a specific research challenge? Let's chat about solutions
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href={mailto}>
                    Email Us
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Need help with your account or have technical questions?
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${email}?subject=${encodeURIComponent("ZEKE: Support Request")}`}>
                    Get Help
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 font-regular text-3xl tracking-tighter md:text-4xl">
              The problems we solve
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="text-left">
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">Before ZEKE</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• "This episode is 10 hours… where are the 2 minutes that matter?"</li>
                    <li>• "Everyone's posting 'breakthroughs'. Which ones move my KPI?"</li>
                    <li>• "I need a brief today, but I'm still swimming in tabs."</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="text-left">
                <CardContent className="p-6">
                  <h3 className="mb-2 font-semibold">After ZEKE</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Instant briefs with "Why it matters" and timestamps</li>
                    <li>• Cross-source synthesis with relevance to your goals</li>
                    <li>• Ready-to-use plans, prompts, and content with citations</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="pb-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Our small team at Minton Holdings LLC</strong> typically responds within 1–2 business days.
              For immediate research needs, try our free demo above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
