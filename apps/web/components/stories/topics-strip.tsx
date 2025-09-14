/**
 * Topics Strip component
 * Full-width section displaying topic categories and links
 */

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { topicsData } from '../../lib/stories-utils';

export function TopicsStrip() {
  const { columns } = topicsData;

  return (
    <div className="overflow-hidden rounded-md border">
      <section className="bg-background px-4 py-8 dark:bg-slate-900">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-[11px] text-muted-foreground uppercase tracking-wide">
                {col.title}
              </div>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      className="inline-flex items-center gap-2 font-medium text-foreground hover:underline"
                      href={link.href}
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Decorative multi‑rule */}
      <div className="bg-background dark:bg-slate-900">
        <div className="px-4">
          <div className="h-1 bg-border" />
          <div className="h-1 bg-border/70" />
          <div className="h-px bg-border/50" />
        </div>
      </div>

      {/* Light spacer */}
      <div className="h-4 bg-muted/30" />
    </div>
  );
}
