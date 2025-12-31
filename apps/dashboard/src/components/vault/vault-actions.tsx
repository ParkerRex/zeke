"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { VaultViewSwitch } from "@/components/vault/vault-view-switch";
import { VaultUploadButton } from "./vault-upload-button";

export function VaultActions() {
  return (
    <div className="space-x-2 hidden md:flex">
      <VaultViewSwitch />
      <VaultUploadButton />
    </div>
  );
}
