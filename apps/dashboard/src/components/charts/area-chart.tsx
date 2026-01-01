"use client";

// Placeholder chart component - TODO: Implement with actual charting library
type AreaChartProps = {
  data?: unknown;
  height?: number;
  className?: string;
};

export function AreaChart({ height = 200, className }: AreaChartProps) {
  return (
    <div
      className={`flex items-center justify-center bg-muted/50 rounded-md ${className ?? ""}`}
      style={{ height }}
    >
      <span className="text-muted-foreground text-sm">Chart coming soon</span>
    </div>
  );
}
