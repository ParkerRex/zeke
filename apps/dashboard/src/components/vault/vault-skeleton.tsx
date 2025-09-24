"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.



import { DataTableSkeleton } from "@/components/tables/vault/data-table-skeleton";
import { useDocumentParams } from "@/hooks/use-document-params";
import { VaultGridSkeleton } from "./vault-grid-skeleton";

export function VaultSkeleton() {
  const { params } = useDocumentParams();

  if (params.view === "grid") {
    return <VaultGridSkeleton />;
  }

  return <DataTableSkeleton />;
}
