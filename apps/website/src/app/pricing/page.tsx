import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@zeke/ui/accordion";
import { Button } from "@zeke/ui/button";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "ZEKE's pricing",
};

export default function Page() {
  return (
    <>
      <div className="container">
        <div>
          <div className="flex items-center flex-col text-center relative">
            <h1 className="mt-24 font-medium text-center text-5xl mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-md text-muted-foreground mb-12 max-w-2xl">
              Start turning scattered research into actionable insights today.
            </p>

            <div className="grid grid-cols-1 w-full max-w-5xl mt-8">
              {/* Pro Plan */}
              <div className="flex flex-col p-8 border border-primary bg-background relative max-w-md mx-auto w-full">
                <h2 className="text-xl text-left mb-2">Pro</h2>
                <div className="mt-1 flex items-baseline">
                  <span className="text-[40px] font-medium tracking-tight">
                    $20
                  </span>
                  <span className="ml-1 text-2xl font-medium">/mo</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Excl. VAT
                  </span>
                </div>
                <p className="mt-4 text-[#878787] text-left text-sm">
                  For individuals and teams who need powerful research
                  intelligence.
                </p>

                <div className="mt-8">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-left text-[#878787] font-mono">
                    INCLUDING
                  </h3>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                      <span className="text-sm">Unlimited research briefs</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                      <span className="text-sm">
                        Process podcasts, videos, and papers
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                      <span className="text-sm">
                        Verified citations & timestamps
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                      <span className="text-sm">Custom SOPs and playbooks</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                      <span className="text-sm">
                        Advanced analysis & insights
                      </span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                      <span className="text-sm">Export to all formats</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                      <span className="text-sm">Priority support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                      <span className="text-sm">API access</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 border-t border-border pt-8">
                  <Link href={process.env.NEXT_PUBLIC_APP_URL || "/"}>
                    <Button className="w-full h-12">Get started</Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 flex w-full max-w-5xl items-center justify-center">
              <p className="mt-4 text-xs text-muted-foreground font-mono">
                Cancel anytime (No credit card required to start)
              </p>
            </div>
          </div>
        </div>

        <div className="container max-w-[800px] mt-32">
          <div>
            <div className="text-center">
              <h4 className="text-4xl">Frequently asked questions</h4>
            </div>

            <Accordion type="single" collapsible className="w-full mt-10 mb-48">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <span className="truncate">
                    How much time will I actually save?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Most users go from 2-10 hours of research per week to 15-30
                  minutes. A 3-hour podcast becomes a 5-minute brief with
                  timestamps to jump to what matters.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  What if I need to verify the insights?
                </AccordionTrigger>
                <AccordionContent>
                  Every claim includes timestamps, quotes, or source snippets.
                  Click any insight to jump to the exact moment in the original
                  content.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is ZEKE open source?</AccordionTrigger>
                <AccordionContent>
                  Yes. You can find the repository{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://github.com/zekehq/zeke"
                    className="underline"
                  >
                    here
                  </a>
                  .
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  <span className="truncate max-w-[300px] md:max-w-full">
                    Can I cancel my subscription at any time?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Yes, you can cancel your subscription at any time. You can
                  export all your research briefs and playbooks before your
                  subscription ends.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>
                  <span className="truncate max-w-[300px] md:max-w-full">
                    What sources can ZEKE process?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  ZEKE processes YouTube videos, podcasts, research papers, blog
                  posts, and more. We support most major content platforms and
                  are continuously adding new sources.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>
                  <span className="truncate max-w-[300px] md:max-w-full">
                    I have more questions about ZEKE. How can I get in touch?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  Sure, we're happy to answer any questions you might have. Just
                  visit our{" "}
                  <Link href="/support" className="underline">
                    support page
                  </Link>{" "}
                  and we'll get back to you as soon as possible.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </>
  );
}
