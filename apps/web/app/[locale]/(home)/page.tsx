import { getDictionary } from '@zeke/internationalization';
import { createMetadata } from '@zeke/seo/metadata';
import { getSession } from '@zeke/supabase/queries';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  AskZekeCard,
  DailyIndexCard,
  LatestStoriesSection,
  PersonalizedStoriesFeed,
  PromoCard,
  TopStoriesSection,
  TopTopicsSidebar,
  TopicsStrip,
} from '../../../components/stories';

type HomeProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{ code?: string }>;
};

export const generateMetadata = async ({
  params,
}: HomeProps): Promise<Metadata> => {
  const { locale } = await params;
  const _dictionary = await getDictionary(locale);

  return createMetadata({
    title: 'ZEKE - AI Research Intelligence',
    description:
      'Stay ahead with AI-powered research analysis and insights. Turn 10 hours of research into 5 minutes of verified insights.',
  });
};

const Home = async ({ params, searchParams }: HomeProps) => {
  const { locale } = await params;
  const { code } = await searchParams;

  // If Supabase sent us a code to the root URL, forward to the auth callback.
  if (typeof code === 'string' && code.length > 0) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  const session = await getSession();
  if (session) {
    redirect('/home');
  }

  return (
    <div className="container mx-auto py-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Left: main content */}
        <div className="col-span-12 space-y-4 lg:col-span-8">
          <TopStoriesSection />
          <LatestStoriesSection />
        </div>

        {/* Right: sidebar */}
        <aside className="col-span-12 space-y-4 lg:col-span-4">
          <DailyIndexCard />
          <AskZekeCard />
          <TopTopicsSidebar />
          <PromoCard />
        </aside>
      </div>

      {/* Full-width sections */}
      <PersonalizedStoriesFeed />

      <div className="mt-8">
        <TopicsStrip />
      </div>
    </div>
  );
};

export default Home;
