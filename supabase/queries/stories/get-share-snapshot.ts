import type { Cluster } from "@/types/stories";
import { getStoryById } from "./get-story-by-id";
import { listStories } from "./list-stories";

export async function getShareSnapshot(
  id: string
): Promise<Cluster | undefined> {
  const story = await getStoryById(id);
  if (story) {
    return story;
  }
  const all = await listStories();
  return all[0];
}
