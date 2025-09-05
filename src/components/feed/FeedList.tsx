import { listStories } from '@/features/stories';

import StoryRow from './StoryRow';

export default async function FeedList() {
  // Server component: fetch clusters (placeholder from in-memory util)
  const clusters = await listStories();
  return (
    <div className='divide-y'>
      {clusters.map((c) => (
        <StoryRow key={c.id} cluster={c} />
      ))}
    </div>
  );
}
