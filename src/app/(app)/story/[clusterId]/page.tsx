import StoryClient from './story-client';

export default async function StoryRoute({
  params,
}: {
  params: Promise<{ clusterId: string }>;
}) {
  const { clusterId } = await params;
  return <StoryClient id={clusterId} />;
}
