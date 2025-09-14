/**
 * Story card component for displaying story information
 */

import { Badge } from '@zeke/design-system/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
} from '@zeke/design-system/components/ui/card';
import { cn } from '@zeke/design-system/lib/utils';
import type { Cluster } from '@zeke/supabase/types';
import Image from 'next/image';
import Link from 'next/link';
import {
  MIN_SOURCES_COUNT,
  deterministicPercent,
  domainFromUrl,
  getKindLabel,
  hypePercent,
  imageFor,
} from '../../lib/stories-utils';
import { CoverageBar } from './coverage-bar';
import { HypeBar } from './hype-bar';
import { SourcesBadge } from './sources-badge';

interface StoryCardProps {
  story: Cluster;
  variant?: 'default' | 'featured' | 'compact';
  showHype?: boolean;
  showImage?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export function StoryCard({
  story,
  variant = 'default',
  showHype = false,
  showImage = true,
  showTimestamp = true,
  className,
}: StoryCardProps) {
  const img = imageFor(story);
  const coverage = deterministicPercent(story.id);
  const hype = hypePercent(story);
  const sources = story.overlays?.sources?.length ?? 0;
  const kind = story.embedKind;
  const domain = domainFromUrl(story.primaryUrl);

  const isCompact = variant === 'compact';

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-md',
        isCompact && 'h-fit',
        className
      )}
    >
      <CardContent className={cn('p-3', isCompact && 'p-2')}>
        {/* Header with metadata */}
        <div className="mb-2 flex items-start justify-between">
          <Badge variant="outline" className="text-xs">
            {getKindLabel(kind)}
            {domain && `, ${domain}`}
          </Badge>
        </div>

        {/* Title */}
        <CardHeader className="p-0 pb-2">
          <h3
            className={cn(
              'font-semibold leading-snug',
              isCompact ? 'text-sm' : 'text-base'
            )}
          >
            <Link
              className="hover:underline"
              href={`/stories/${encodeURIComponent(story.id)}`}
            >
              {story.title}
            </Link>
          </h3>
        </CardHeader>

        {/* Metrics */}
        <div className="mb-3 flex items-center justify-between gap-3">
          {showHype ? (
            <HypeBar value={hype} />
          ) : (
            <CoverageBar value={coverage} />
          )}
          <SourcesBadge count={Math.max(MIN_SOURCES_COUNT, sources)} />
        </div>

        {/* Image */}
        {showImage && (
          <div
            className={cn(
              'relative overflow-hidden rounded',
              isCompact ? 'h-[100px]' : 'h-[150px]'
            )}
          >
            <Image alt={story.title} className="object-cover" fill src={img} />
            {showTimestamp && (
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-white text-xs">
                1 hour ago
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
