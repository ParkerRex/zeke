"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { Button } from "@zeke/ui/button";
import { Icons } from "@zeke/ui/icons";

export function VaultUploadButton() {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => document.getElementById("upload-files")?.click()}
    >
      <Icons.Add size={17} />
    </Button>
  );
}
