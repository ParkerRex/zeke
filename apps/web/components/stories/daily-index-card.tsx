/**
 * Daily Index Card component
 * Displays daily sentiment index with visual indicator
 */

import { Card, CardContent, CardHeader, CardTitle } from '@zeke/design-system/components/ui/card';
import { getDailyIndexScore } from '../../lib/stories-utils';

export function DailyIndexCard() {
  const { score, sentiment, bucketLabel } = getDailyIndexScore();
  const today = new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Daily Index</CardTitle>
          <div className="text-muted-foreground text-xs">
            {today.toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Scale labels */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Optimistic</span>
          <span>Positive</span>
        </div>
        
        {/* Progress bar with indicator */}
        <div className="relative h-8 w-full">
          <div className="absolute inset-0 flex items-center gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div className="h-1 flex-1 rounded bg-muted" key={i} />
            ))}
          </div>
          <div
            className="absolute -top-1 h-6 w-1.5 rounded bg-foreground"
            style={{ left: `calc(${score}% - 2px)` }}
            title={`Index: ${score}`}
          />
        </div>
        
        {/* Score display */}
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-foreground px-1 font-medium text-background">
            {score}
          </span>
          <span className="font-medium">{sentiment}</span>
          <span className="text-muted-foreground">• {bucketLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
