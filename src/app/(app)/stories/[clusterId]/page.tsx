import StoryClient from '../../story/[clusterId]/story-client';

export default async function StoriesClusterRoute({ params }: { params: any }) {
  const { clusterId } = await params;
  return <StoryClient id={clusterId} />;
}
