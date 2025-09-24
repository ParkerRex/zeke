"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { InboxOrdering } from "@/components/inbox/inbox-ordering";
import { InboxSearch } from "@/components/inbox/inbox-search";
import { Button } from "@zeke/ui/button";
import { Icons } from "@zeke/ui/icons";

export function InboxHeader() {
  return (
    <div className="flex justify-center items-center space-x-4 mb-4 mt-6 w-full pr-[647px]">
      <InboxSearch />

      <div className="flex space-x-2">
        <InboxOrdering />

        <Button
          variant="outline"
          size="icon"
          onClick={() => document.getElementById("upload-files")?.click()}
        >
          <Icons.Add size={17} />
        </Button>
      </div>
    </div>
  );
}
