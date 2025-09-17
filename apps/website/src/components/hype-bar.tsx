/**
 * Hype bar component for displaying story hype/excitement level
 */

import { cn } from '@zeke/ui/lib/utils';

interface HypeBarProps {
  value: number;
  className?: string;
}

export function HypeBar({ value, className }: HypeBarProps) {
  // Convert 0-100 value to color intensity
  const getHypeColor = (hype: number) => {
    if (hype < 20) {
      return 'bg-muted';
    }
    if (hype < 40) {
      return 'bg-yellow-400';
    }
    if (hype < 60) {
      return 'bg-orange-400';
    }
    if (hype < 80) {
      return 'bg-red-400';
    }
    return 'bg-red-600';
  };

  const getHypeLabel = (hype: number) => {
    if (hype < 20) {
      return 'Low';
    }
    if (hype < 40) {
      return 'Mild';
    }
    if (hype < 60) {
      return 'Moderate';
    }
    if (hype < 80) {
      return 'High';
    }
    return 'Extreme';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-300',
            getHypeColor(value)
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs">
        {getHypeLabel(value)}
      </span>
    </div>
  );
}
