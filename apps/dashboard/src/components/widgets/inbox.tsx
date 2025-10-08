"use client";

type InboxWidgetProps = {
  disabled?: boolean;
  className?: string;
};

export function Inbox({ disabled, className }: InboxWidgetProps) {
  return (
    <div
      className={`flex h-full flex-col justify-center gap-3 rounded-xl border border-dashed border-border bg-background/60 p-6 ${className ?? ""}`.trim()}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Research Inbox</h3>
        <p className="text-sm text-muted-foreground">
          {disabled
            ? "Connect a source to unlock automatic intake."
            : "Centralize new stories and triage them into briefs."}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        We&apos;re finishing this flow. For now you can add stories directly
        from the research feed.
      </p>
    </div>
  );
}
