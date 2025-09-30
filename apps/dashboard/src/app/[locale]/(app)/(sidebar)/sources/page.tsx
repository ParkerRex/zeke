import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sources • ZEKE",
  description:
    "Connect newsletters, feeds, and research streams so ZEKE can keep them in sync.",
  alternates: { canonical: "/sources" },
};

export default function SourcesPage() {
  return (
    <section className="flex h-full flex-col gap-8 p-6 text-sm text-muted-foreground">
      <div className="max-w-xl space-y-3">
        <h1 className="font-medium text-foreground">Sources</h1>
        <p>
          This is where teams will connect RSS feeds, newsletters, research
          hubs, and other inputs for the ingestion pipeline. We&apos;re still
          wiring the new Trigger.dev tasks and Cloudflare worker routes, so the
          UI is a placeholder for now.
        </p>
        <p>
          As soon as the provider onboarding flow lands, you&apos;ll be able to
          add sources here and watch ZEKE collect, normalize, and route stories
          through the new job system.
        </p>
      </div>
    </section>
  );
}
