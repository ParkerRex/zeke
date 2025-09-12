import { redirect } from "next/navigation";

export default function StoryRoute({
  params,
}: {
  params: { clusterId: string };
}) {
  redirect(`/stories/${encodeURIComponent(params.clusterId)}`);
}
