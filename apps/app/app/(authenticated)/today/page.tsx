import FeedList from '../components/feed-list';

export default function TodayPage() {
  return (
    <div>
      <div className="border-b bg-background/50 p-4 backdrop-blur">
        Today&apos;s Top Stories
      </div>
      <FeedList />
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Today • ZEKE',
  description: 'Today’s top AI and tech stories with contextual insights.',
};
