/**
 * Stories listing page
 */

import { Button } from '@zeke/design-system/components/ui/button';
import { Input } from '@zeke/design-system/components/ui/input';
import { getDictionary } from '@zeke/internationalization';
import { createMetadata } from '@zeke/seo/metadata';
import { listStories } from '@zeke/supabase/queries';
import { FileText, Search } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState, PageHeader } from '../../../components/layout';

type StoriesPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: StoriesPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const _dictionary = await getDictionary(locale);

  return createMetadata({
    title: 'Stories - ZEKE Research Intelligence',
    description:
      'Browse the latest AI research stories, compressed from hours of content into verified insights with receipts.',
  });
};

async function StoriesGrid({ searchQuery }: { searchQuery?: string }) {
  const stories = await listStories();

  // Simple client-side filtering for demo purposes
  const filteredStories = searchQuery
    ? stories.filter(
        (story) =>
          story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.embedKind?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stories;

  if (filteredStories.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No stories found"
        description={
          searchQuery
            ? `No stories match "${searchQuery}". Try a different search term.`
            : 'No stories available at the moment. Check back later!'
        }
        action={
          searchQuery
            ? {
                label: 'Clear Search',
                href: '/stories',
              }
            : undefined
        }
      />
    );
  }

  return (
    <StoriesGrid stories={filteredStories} columns={{ sm: 2, lg: 3, xl: 4 }} />
  );
}

function StoriesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="p-3">
              <div className="mb-2 h-4 w-20 rounded bg-muted" />
              <div className="mb-2 space-y-2">
                <div className="h-5 w-full rounded bg-muted" />
                <div className="h-5 w-3/4 rounded bg-muted" />
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="h-1 flex-1 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
              <div className="h-[150px] w-full rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const StoriesPage = async ({ params, searchParams }: StoriesPageProps) => {
  const { locale } = await params;
  const { q: searchQuery } = await searchParams;
  const _dictionary = await getDictionary(locale);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <PageHeader
        title="AI Research Stories"
        description="Discover the latest AI research, compressed from hours of content into 5-minute insights with receipts."
      />

      {/* Search */}
      <div className="mb-8">
        <form className="relative max-w-md">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            defaultValue={searchQuery}
            name="q"
            className="pl-10"
          />
          <Button type="submit" className="sr-only">
            Search
          </Button>
        </form>
      </div>

      {/* Stories Grid */}
      <Suspense fallback={<StoriesGridSkeleton />}>
        <StoriesGrid searchQuery={searchQuery} />
      </Suspense>
    </div>
  );
};

export default StoriesPage;
