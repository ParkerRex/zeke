"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.



import { ErrorFallback } from "@/components/error-fallback";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense, useState } from "react";
import type { TransactionType } from "./data";
import { TransactionsListSkeleton } from "./skeleton";
import { TransactionsListHeader } from "./transaction-list-header";
import { TransactionsList } from "./transactions-list";
import { TransactionsPeriod } from "./transactions-period";

type Props = {
  disabled: boolean;
};

export function Transactions({ disabled }: Props) {
  const [type, setType] = useState<TransactionType>("all");

  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <TransactionsPeriod type={type} setType={setType} disabled={disabled} />

      <div className="mt-4">
        <TransactionsListHeader />
        <ErrorBoundary errorComponent={ErrorFallback}>
          <Suspense fallback={<TransactionsListSkeleton />}>
            <TransactionsList type={type} disabled={disabled} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
