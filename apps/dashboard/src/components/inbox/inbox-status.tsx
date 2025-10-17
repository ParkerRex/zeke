"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Icons } from "@zeke/ui/icons";
import { Spinner } from "@zeke/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@zeke/ui/tooltip";

type Props = {
  item: RouterOutputs["inbox"]["get"]["data"][number];
};

export function InboxStatus({ item }: Props) {
  if (item.status === "processing" || item.status === "new") {
    return null;
  }

  if (item.status === "analyzing") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1 items-center p-1 text-[#878787] text-[10px] px-1.5 py-0.5 cursor-default font-mono border">
              <Spinner size={14} className="stroke-primary" />
              <span>Analyzing</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>Analyzing content</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "pending") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-1 text-[10px] px-1.5 py-0.5 cursor-default font-mono inline-block border">
              <span>Pending</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>Awaiting processing</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (item.status === "done") {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex space-x-1 items-center px-1.5 py-0.5 text-[10px] cursor-default font-mono border">
              <Icons.Check className="size-3.5 mt-[1px]" />
              <span>Processed</span>
            </div>
          </TooltipTrigger>
          <TooltipContent sideOffset={10} className="text-xs">
            <p>Content has been processed</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex space-x-1 items-center px-1.5 py-0.5 text-[10px] cursor-default font-mono border">
            <span>Unprocessed</span>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={10} className="text-xs">
          <p>Content needs review</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
