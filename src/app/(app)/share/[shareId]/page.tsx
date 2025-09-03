import ShareClient from './share-client';

export default async function ShareRoute({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  return <ShareClient id={shareId} />;
}
