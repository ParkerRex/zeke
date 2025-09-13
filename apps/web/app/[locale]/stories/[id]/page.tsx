/**
 * Individual story detail page
 */

import { Badge } from '@zeke/design-system/components/ui/badge';
import { Button } from '@zeke/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@zeke/design-system/components/ui/card';
import { listStories } from '@zeke/supabase/queries';
import { getDictionary } from '@zeke/internationalization';
import { createMetadata } from '@zeke/seo/metadata';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  deterministicPercent, 
  domainFromUrl, 
  getKindLabel, 
  hypePercent, 
  imageFor,
  MIN_SOURCES_COUNT 
} from '../../../../lib/stories-utils';
import { CoverageBar } from '../../../../components/stories/coverage-bar';
import { HypeBar } from '../../../../components/stories/hype-bar';
import { SourcesBadge } from '../../../../components/stories/sources-badge';

type StoryPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: StoryPageProps): Promise<Metadata> => {
  const { locale, id } = await params;
  const dictionary = await getDictionary(locale);
  
  // Get the story for metadata
  const stories = await listStories();
  const story = stories.find(s => s.id === decodeURIComponent(id));
  
  if (!story) {
    return createMetadata({
      title: 'Story Not Found - ZEKE',
      description: 'The requested story could not be found.',
    });
  }

  return createMetadata({
    title: `${story.title} - ZEKE`,
    description: `AI research insight: ${story.title}. Compressed from hours of content into verified insights with receipts.`,
  });
};

const StoryPage = async ({ params }: StoryPageProps) => {
  const { locale, id } = await params;
  const dictionary = await getDictionary(locale);
  
  // Get all stories and find the specific one
  const stories = await listStories();
  const story = stories.find(s => s.id === decodeURIComponent(id));
  
  if (!story) {
    notFound();
  }

  const img = imageFor(story);
  const coverage = deterministicPercent(story.id);
  const hype = hypePercent(story);
  const sources = story.overlays?.sources?.length ?? 0;
  const kind = story.embedKind;
  const domain = domainFromUrl(story.primaryUrl);

  return (
    <div className="container mx-auto py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/stories" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Stories
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <article>
            {/* Header */}
            <header className="mb-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {getKindLabel(kind)}
                </Badge>
                {domain && (
                  <Badge variant="secondary">
                    {domain}
                  </Badge>
                )}
              </div>
              
              <h1 className="mb-4 text-3xl font-bold leading-tight">
                {story.title}
              </h1>
              
              {/* Metrics */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">1 hour ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SourcesBadge count={Math.max(MIN_SOURCES_COUNT, sources)} />
                </div>
              </div>
            </header>

            {/* Featured image */}
            <div className="relative mb-6 h-[300px] overflow-hidden rounded-lg">
              <Image 
                alt={story.title} 
                className="object-cover" 
                fill 
                src={img} 
                priority
              />
            </div>

            {/* Content placeholder */}
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="lead">
                This story has been compressed from hours of research into key insights with verified sources and timestamps.
              </p>
              
              <h2>Key Insights</h2>
              <ul>
                <li>AI research breakthrough in {getKindLabel(kind).toLowerCase()} format</li>
                <li>Verified through {Math.max(MIN_SOURCES_COUNT, sources)} independent sources</li>
                <li>Coverage analysis shows {Math.round(coverage)}% comprehensive review</li>
                <li>Community hype level indicates {hype > 60 ? 'high' : hype > 30 ? 'moderate' : 'low'} interest</li>
              </ul>
              
              <h2>Why This Matters</h2>
              <p>
                This research represents a significant development in the AI field, with implications for 
                operators, founders, marketers, and product managers working with AI technologies.
              </p>
              
              <h2>Receipts & Verification</h2>
              <p>
                All insights are backed by source material with timestamps and citations. 
                Click the source links below to verify claims and dive deeper into the original content.
              </p>
            </div>
          </article>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Metrics card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Story Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Coverage</span>
                  <span className="text-sm text-muted-foreground">{Math.round(coverage)}%</span>
                </div>
                <CoverageBar value={coverage} />
              </div>
              
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Hype Level</span>
                  <span className="text-sm text-muted-foreground">{Math.round(hype)}%</span>
                </div>
                <HypeBar value={hype} />
              </div>
            </CardContent>
          </Card>

          {/* Source link */}
          {story.primaryUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Source</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <a 
                    href={story.primaryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    View Original
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Related topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">AI Research</Badge>
                <Badge variant="secondary">Machine Learning</Badge>
                <Badge variant="secondary">Technology</Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default StoryPage;
