import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Briefs • ZEKE",
  description:
    "Assemble executive-ready briefs that cite the latest sources and insights.",
  alternates: { canonical: "/briefs" },
};

export default function BriefsPage() {
  return (
    <section className="flex h-full flex-col gap-8 p-6 text-sm text-muted-foreground">
      <div className="max-w-xl space-y-3">
        <h1 className="font-medium text-foreground">Briefs</h1>
        <p>
          Playbooks and summaries will output into briefs—structured packets that
          teams can share or export. We&apos;re still wiring the reporting pipelines, so
          consider this a placeholder while the new story → insight → brief workflow
          takes shape.
        </p>
      </div>
    </section>
  );
}
