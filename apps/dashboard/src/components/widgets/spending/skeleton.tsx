// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { Skeleton } from "@zeke/ui/skeleton";

export function SpendingListSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      {[...Array(16)].map((_, index) => (
        <div
          key={index.toString()}
          className="flex justify-between items-center"
        >
          <div className="w-[70%] flex space-x-4 pr-8 items-center">
            <Skeleton className="size-[12px] flex-shrink-0" />
            <Skeleton className="h-[6px] w-full rounded-none" />
          </div>
          <div className="w-full ml-auto">
            <Skeleton className="w-full align-start h-[6px] rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
