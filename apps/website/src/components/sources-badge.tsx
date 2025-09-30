import { Badge } from "@zeke/ui/badge";
import { cn } from "@zeke/ui/utils";

interface SourcesBadgeProps {
  count: number;
  className?: string;
}

export function SourcesBadge({ count, className }: SourcesBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("font-medium text-xs", className)}>
      {count} source{count !== 1 ? "s" : ""}
    </Badge>
  );
}
