/**
 * Sources badge component for displaying number of sources
 */

import { Badge } from '@zeke/design-system/components/ui/badge';
import { cn } from '@zeke/design-system/lib/utils';

interface SourcesBadgeProps {
  count: number;
  className?: string;
}

export function SourcesBadge({ count, className }: SourcesBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={cn("text-xs font-medium", className)}
    >
      {count} source{count !== 1 ? 's' : ''}
    </Badge>
  );
}
