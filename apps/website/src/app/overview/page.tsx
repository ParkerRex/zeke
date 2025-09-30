import { Assistant } from "@/components/assistant";
import { Button } from "@zeke/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

const highlightItems = [
  {
    title: "Sift beyond your bandwidth",
    copy: "Drop podcasts, papers, product updates, and posts. Zeke flags the claims, numbers, and contradictions you would have missed without a full-time researcher.",
  },
  {
    title: "Receipts on every insight",
    copy: "Every brief is grounded by citations, timestamps, and uncertainty flags so you can jump straight to proof and never ship AI slop.",
  },
  {
    title: "Apply instantly",
    copy: "Load your goals or SOPs to turn findings into playbooks, prompts, and enablement assets that ship right away.",
  },
];

export const metadata: Metadata = {
  title: "Overview — Zeke Research Intelligence",
  description:
    "Turn sprawling content into verified, ready-to-apply outputs. See how Zeke compresses research from 10 hours to 5 minutes—without losing the signal.",
};

export default function OverviewPage(): JSX.Element {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[64px] md:text-[150px] mb-2 leading-none text-stroke">
          Research
        </h1>

        <h2 className="font-medium text-center text-[64px] md:text-[150px] mb-2 leading-none">
          Overview
        </h2>

        <div className="flex items-center flex-col text-center">
          <p className="text-lg mt-6 max-w-[720px] text-muted-foreground">
            Paste the marathon content, stack it with your goals, and get a
            verified brief plus ready-to-run outputs. Minutes, not days.
          </p>

          <Button asChild className="mt-6">
            <Link href="/contact">Book a research demo</Link>
          </Button>
        </div>
      </div>

      <div className="relative mt-28 grid gap-6 rounded-[32px] border border-border/60 bg-muted/20 p-10 md:grid-cols-3">
        {highlightItems.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-3 rounded-2xl bg-background/70 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-xl">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.copy}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center flex-col text-center relative mt-28">
        <div className="max-w-[640px]">
          <h3 className="font-medium text-xl md:text-2xl mb-4">
            From signal to action
          </h3>
          <p className="text-sm md:text-base text-muted-foreground">
            Link your research queue, choose the outcomes you care about, and
            Zeke produces role-aware takeaways and outputs—PRDs, enablement
            decks, campaign angles, experiment plans—with receipts attached.
          </p>
        </div>

        <div className="mt-14 w-full max-w-[900px] rounded-[28px] border border-border/50 bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-10 text-left">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border/40 bg-background/80 p-6">
              <h4 className="text-lg font-semibold">Briefs with proof</h4>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  6–10 bullet "Why it matters" recap with chapter jump links
                </li>
                <li>
                  Claim ledger with timestamps, sources, and yellow flags for
                  uncertainty
                </li>
                <li>Role lenses for product, GTM, research, and leadership</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background/80 p-6">
              <h4 className="text-lg font-semibold">Outputs that ship</h4>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  Experiment plans, enablement emails, briefs, and content
                  outlines
                </li>
                <li>Auto-filled with KPIs, next steps, and source appendix</li>
                <li>Hand-off ready for your team or to publish directly</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-32 max-w-[550px]">
          <h3 className="font-medium text-xl md:text-2xl mb-4">
            Ask Zeke anything
          </h3>
          <p className="text-[#878787] text-sm md:text-base md:mb-10">
            Our assistant is tuned for research ops. Ask for the claim map, find
            contradictions, or spin up a playbook. Every answer brings receipts
            so you can move fast with confidence.
          </p>
        </div>

        <div className="text-left scale-[0.6] md:scale-100 -mt-16 md:mt-0">
          <Assistant />
        </div>
      </div>
    </div>
  );
}
