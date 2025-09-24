// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { Skeleton } from "@zeke/ui/skeleton";

export function InboxAccountsListSkeleton() {
  return (
    <div className="px-6 divide-y">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index.toString()}
          className="flex items-center justify-between py-4"
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="size-[34px] rounded-full" />
            <div className="flex flex-col space-y-2">
              <Skeleton className="h-3.5 w-[180px] rounded-none" />
              <Skeleton className="h-2.5 w-[120px] rounded-none" />
            </div>
          </div>

          <div className="flex space-x-2 items-center">
            <Skeleton className="rounded-full w-7 h-7" />
            <Skeleton className="rounded-full w-7 h-7" />
          </div>
        </div>
      ))}
    </div>
  );
}
