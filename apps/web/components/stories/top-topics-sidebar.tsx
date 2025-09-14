/**
 * Top Topics Sidebar component
 * Displays trending topics with navigation links
 */

import { Button } from '@zeke/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@zeke/design-system/components/ui/card';
import { ExternalLink, Plus } from 'lucide-react';
import Link from 'next/link';
import { topicsData } from '../../lib/stories-utils';

export function TopTopicsSidebar() {
  const items = topicsData.sidebarItems;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Top Topics</CardTitle>
        {/* Decorative multi-rule */}
        <div className="space-y-[2px]">
          <div className="h-[2px] bg-foreground" />
          <div className="h-[2px] bg-foreground" />
          <div className="h-[1px] bg-foreground" />
        </div>
      </CardHeader>

      <CardContent>
        <ul className="divide-y divide-border">
          {items.map((topic) => (
            <li
              className="flex items-center justify-between py-3"
              key={topic.label}
            >
              <Link
                className="flex items-center gap-3 hover:underline"
                href={topic.href}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground" />
                <span className="font-medium">{topic.label}</span>
              </Link>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/stories" className="flex items-center gap-2">
              View More
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
