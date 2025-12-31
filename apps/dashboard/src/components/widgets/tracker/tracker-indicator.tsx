// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { cn } from "@zeke/ui/cn";

interface Props {
  count: number;
  isToday: boolean;
}

export function TrackerIndicator({ count, isToday }: Props) {
  if (count === 1) {
    return (
      <div className="absolute bottom-2 left-3 right-3">
        <div
          className={cn("h-1 w-1/2 bg-border", isToday && "bg-background")}
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="absolute bottom-2 left-3 right-3 flex justify-center space-x-1">
        <div
          className={cn("h-1 w-1/2 bg-border", isToday && "bg-background")}
        />
        <div
          className={cn("h-1 w-1/2 bg-border", isToday && "bg-background")}
        />
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="absolute bottom-2 left-3 right-3 flex justify-center space-x-1">
        <div
          className={cn("h-1 w-1/2 bg-border", isToday && "bg-background")}
        />
        <div
          className={cn("h-1 w-1/2 bg-border", isToday && "bg-background")}
        />
        <div
          className={cn("h-1 w-1/2 bg-border", isToday && "bg-background")}
        />
      </div>
    );
  }

  if (count > 3) {
    return (
      <div className="absolute bottom-2 left-3 right-3">
        <div
          className={cn("h-1 w-full bg-border", isToday && "bg-background")}
        />
      </div>
    );
  }

  return null;
}
