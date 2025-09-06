import StoryClient from '../../story/[clusterId]/story-client';

export default function StoriesClusterRoute({ params }: { params: { clusterId: string } }) {
  const { clusterId } = params;
  return <StoryClient id={clusterId} />;
}
