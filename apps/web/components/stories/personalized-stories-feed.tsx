/**
 * Personalized Stories Feed component
 * Shows personalized content for logged-in users or signup prompt for guests
 */

import { env } from '@/env';
import { Button } from '@zeke/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@zeke/design-system/components/ui/card';
import { getSession } from '@zeke/supabase/queries';
import { Lock, Settings } from 'lucide-react';
import Link from 'next/link';
import { LatestStoriesSection } from './latest-stories-section';

export async function PersonalizedStoriesFeed() {
  const session = await getSession();

  if (session) {
    // Logged-in: show personalized stories feed
    return <LatestStoriesSection title="Personalized Stories Feed" />;
  }

  // Not logged in: show signup prompt
  return (
    <section className="mt-8">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Personalized Stories Feed</CardTitle>
          <CardDescription>
            Get AI-curated stories tailored to your interests and reading
            history
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="space-y-2 text-muted-foreground text-sm">
            <p>• Custom topic recommendations</p>
            <p>• Smart filtering based on your preferences</p>
            <p>
              • Priority alerts for breaking stories in your areas of interest
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={`${env.NEXT_PUBLIC_APP_URL}/signup`}>
                Get Started
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                href={`${env.NEXT_PUBLIC_APP_URL}/login`}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
