import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights • ZEKE",
  description:
    "Curate AI insights, highlights, and follow-ups tailored to your team.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
  return (
    <section className="flex h-full flex-col gap-8 p-6 text-sm text-muted-foreground">
      <div className="max-w-xl space-y-3">
        <h1 className="font-medium text-foreground">Insights</h1>
        <p>
          Insight review will live here—surfacing highlights, linking them back
          to supporting sources, and queuing any follow-up tasks. The data
          contracts are in place, and the dashboard will light up once the new
          Trigger.dev insight tasks finish landing.
        </p>
        <p>
          Until then, this space reminds us that stories flow into insights, and
          the UI will mirror Midday&apos;s matching cadence with a Zeke-specific
          vocabulary.
        </p>
      </div>
    </section>
  );
}
