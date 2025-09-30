import type { ReactNode } from "react";
import { format } from "date-fns";

interface SidebarProps {
  readonly toc?: ReactNode;
  readonly readingTime?: string;
  readonly date?: Date;
}

export function Sidebar({ toc, readingTime, date }: SidebarProps) {
  return (
    <aside className="w-64 space-y-6 text-muted-foreground text-sm">
      <div className="space-y-2">
        {date ? (
          <div>
            <p className="text-foreground font-medium">Published</p>
            <time dateTime={date.toISOString()}>
              {format(date, "MMMM d, yyyy")}
            </time>
          </div>
        ) : null}
        {readingTime ? (
          <div>
            <p className="text-foreground font-medium">Reading time</p>
            <p>{readingTime}</p>
          </div>
        ) : null}
      </div>
      {toc ? (
        <div>
          <p className="text-foreground font-medium">On this page</p>
          <div className="mt-2 space-y-2">{toc}</div>
        </div>
      ) : null}
    </aside>
  );
}
