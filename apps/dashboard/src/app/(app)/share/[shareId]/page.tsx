import ShareClient from './share-client';

export default function ShareRoute({
  params,
}: {
  params: { shareId: string };
}) {
  const { shareId } = params;
  return <ShareClient id={shareId} />;
}
