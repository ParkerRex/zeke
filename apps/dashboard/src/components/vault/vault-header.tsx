"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.



import { VaultActions } from "@/components/vault/vault-actions";
import { VaultSearchFilter } from "@/components/vault/vault-search-filter";

export function VaultHeader() {
  return (
    <div className="flex justify-between py-6">
      <VaultSearchFilter />
      <VaultActions />
    </div>
  );
}
