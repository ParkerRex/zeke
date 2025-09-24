// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { TrackerWidget } from "./tracker-widget";

export function Tracker() {
  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <ErrorBoundary errorComponent={ErrorFallback}>
        <TrackerWidget />
      </ErrorBoundary>
    </div>
  );
}
