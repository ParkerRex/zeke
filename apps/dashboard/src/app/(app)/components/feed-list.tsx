import { listStories } from '@zeke/supabase/queries';

import StoryRow from './feed/story-row';

export default async function FeedList() {
  // Server component: fetch clusters (placeholder from in-memory util)
  const clusters = await listStories();
  return (
    <div className="divide-y">
      {clusters.map((c) => (
        <StoryRow cluster={c} key={c.id} />
      ))}
    </div>
  );
}
