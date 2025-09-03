import StoryClient from './story-client';

export default async function StoryRoute({ params }: { params: any }) {
  const { clusterId } = await params;
  return <StoryClient id={clusterId} />;
}
