import ShareClient from './share-client';

export default async function ShareRoute({ params }: { params: any }) {
  const { shareId } = await params;
  return <ShareClient id={shareId} />;
}
