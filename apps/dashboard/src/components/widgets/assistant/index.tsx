// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { AssistantWidget } from "./assistant-widget";

export function Assistant() {
  return (
    <div className="border aspect-square overflow-hidden relative flex flex-col p-4 md:p-8">
      <h2 className="text-lg">Assistant</h2>

      <ErrorBoundary errorComponent={ErrorFallback}>
        <Suspense>
          <AssistantWidget />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
