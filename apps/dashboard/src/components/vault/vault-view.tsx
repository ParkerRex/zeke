"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { DataTable } from "@/components/tables/vault/data-table";
import { useDocumentParams } from "@/hooks/use-document-params";
import { VaultGrid } from "./vault-grid";
import { VaultUploadZone } from "./vault-upload-zone";

export function VaultView() {
  const { params } = useDocumentParams();

  return (
    <VaultUploadZone>
      {params.view === "grid" ? <VaultGrid /> : <DataTable />}
    </VaultUploadZone>
  );
}
