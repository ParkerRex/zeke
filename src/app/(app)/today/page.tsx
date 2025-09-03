import FeedList from '@/components/feed/FeedList';

export default function TodayPage() {
  return (
    <div>
      <div className='border-b bg-background/50 p-4 backdrop-blur'>Today&apos;s Top Stories</div>
      <FeedList />
    </div>
  );
}
