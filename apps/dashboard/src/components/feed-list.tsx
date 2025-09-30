import { fetchStoriesForDashboard } from "@/utils/stories";

import StoryRow from "./feed/story-row";

export default async function FeedList() {
  const { stories: clusters } = await fetchStoriesForDashboard();
  return (
    <div className="divide-y">
      {clusters.map((c) => (
        <StoryRow cluster={c} key={c.id} />
      ))}
    </div>
  );
}
