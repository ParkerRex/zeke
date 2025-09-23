import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playbooks • ZEKE",
  description:
    "Design repeatable automations that orchestrate source ingestion, analysis, and delivery.",
  alternates: { canonical: "/playbooks" },
};

export default function PlaybooksPage() {
  return (
    <section className="flex h-full flex-col gap-8 p-6 text-sm text-muted-foreground">
      <div className="max-w-xl space-y-3">
        <h1 className="font-medium text-foreground">Playbooks</h1>
        <p>
          Playbooks will let you string together Trigger.dev tasks—collecting sources,
          generating insights, and publishing briefs on a schedule. The UI will land
          once the new job orchestration is stable; for now we&apos;re keeping a placeholder
          so routing and navigation stay aligned with the Midday structure.
        </p>
      </div>
    </section>
  );
}
