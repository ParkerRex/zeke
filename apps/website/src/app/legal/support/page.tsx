/**
 * Support page with ZEKE branding and value proposition
 */

import { createMetadata } from "@zeke/seo/metadata";
import { Button } from "@zeke/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zeke/ui/card";
import { Icons } from "@zeke/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/env";

export const metadata: Metadata = createMetadata({
  title: "Support - ZEKE",
  description:
    "Get help with the ZEKE research intelligence platform. From quick questions to team setup, we're here to help you compress research from 10 hours to 5 minutes.",
});

export default function SupportPage(): JSX.Element {
  const email = "me@parkerrex.com";
  const supportSubject = encodeURIComponent("ZEKE: Support Request");
  const supportBody = encodeURIComponent(
    "Hi! I need help with ZEKE. Here's my question:",
  );
  const supportMailto = `mailto:${email}?subject=${supportSubject}&body=${supportBody}`;

  return (
    <div className="w-full">
      <div className="container mx-auto">
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

        <div className="py-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icons.Zap className="h-6 w-6 text-primary" />
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
                  <Icons.Mail className="h-6 w-6 text-primary" />
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
                  <Icons.MessageSquare className="h-6 w-6 text-primary" />
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
                    href={`mailto:${email}?subject=${encodeURIComponent("ZEKE: Feature Request")}`}
                  >
                    Share Idea
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center font-regular text-3xl tracking-tighter md:text-4xl">
              Common Questions
            </h2>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.HelpCircle className="h-5 w-5 text-primary" />
                    How does ZEKE compress 10 hours to 5 minutes?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ZEKE analyzes long-form content and extracts the key
                    insights, claims, and actionable items. Every point links to
                    timestamps or source snippets for verification, letting you
                    jump straight to what matters.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.BookOpen className="h-5 w-5 text-primary" />
                    What makes ZEKE different from other AI tools?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ZEKE doesn't just summarize—it applies insights to your
                    specific goals and SOPs. We provide receipts (timestamps,
                    quotes, citations) for every claim and help you create
                    actionable outputs with proper attribution.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.Clock className="h-5 w-5 text-primary" />
                    How quickly do you respond to support requests?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our small team at Minton Holdings LLC typically responds
                    within 1–2 business days. For urgent issues or demo requests
                    we often respond faster. For immediate help, try the free
                    demo to see if it answers your questions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

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
}
