"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useDocumentParams } from "@/hooks/use-document-params";
import { Button } from "@zeke/ui/button";
import { cn } from "@zeke/ui/cn";
import { Icons } from "@zeke/ui/icons";

export function VaultViewSwitch() {
  const { params, setParams } = useDocumentParams();

  return (
    <div className="flex gap-2 text-[#878787]">
      <Button
        variant="outline"
        size="icon"
        className={cn(params.view === "grid" && "border-primary text-primary")}
        onClick={() => setParams({ view: "grid" })}
      >
        <Icons.GridView size={18} />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className={cn(params.view === "list" && "border-primary text-primary")}
        onClick={() => setParams({ view: "list" })}
      >
        <Icons.ListView size={18} />
      </Button>
    </div>
  );
}
