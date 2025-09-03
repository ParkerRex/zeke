import { listStories } from "@/server/stories";
import StoryRow from "./StoryRow";

export default async function FeedList() {
  // Server component: fetch clusters (placeholder from in-memory util)
  const clusters = listStories();
  return (
    <div className="p-4 space-y-2">
      {clusters.map((c) => (
        <StoryRow key={c.id} cluster={c} />
      ))}
    </div>
  );
}

