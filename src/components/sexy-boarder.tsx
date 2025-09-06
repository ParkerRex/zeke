import { cn } from "@/utils/cn";

export function FramedContainer({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background p-4",
        className
      )}
    >
      <div className="w-full">{children}</div>
    </div>
  );
}
