/**
 * Coverage bar component for displaying story coverage percentage
 */

import { cn } from '@zeke/design-system/lib/utils';

interface CoverageBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function CoverageBar({ value, label, className }: CoverageBarProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs">
        {Math.round(value)}%
      </span>
    </div>
  );
}
