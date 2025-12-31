// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

export function Tracker() {
  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <div className="flex h-full w-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Tracker coming soon</p>
        <p className="mt-2 max-w-[220px]">
          Time-tracking and research velocity analytics will appear here once
          the tracker pipeline is wired into the dashboard.
        </p>
      </div>
    </div>
  );
}
