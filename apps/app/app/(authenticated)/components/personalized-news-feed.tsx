import { getSession } from "@zeke/supabase/queries";
import Link from "next/link";
import { IoLockClosed, IoSettingsSharp } from "react-icons/io5";
import { Button } from "@zeke/design-system/components/ui/button";
import LatestNewsSection from "./latest-news-section";

export default async function PersonalizedNewsFeed() {
  const session = await getSession();
  if (session) {
    // Logged-in: reuse LatestNewsSection but with a personalized title.
    return <LatestNewsSection title="Personalized News Feed" />;
  }

  // Locked state for logged-out users
  return (
    <section className="mt-10">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold text-2xl">Personalized News Feed</h2>
        <button
          aria-label="Settings"
          className="rounded border bg-white p-2 text-gray-700 hover:bg-gray-50"
          type="button"
        >
          <IoSettingsSharp size={16} />
        </button>
      </div>
      {/* Decorative rules under heading */}
      <div className="mb-4 space-y-[2px]">
        <div className="h-[2px] bg-gray-900" />
        <div className="h-[2px] bg-gray-900" />
        <div className="h-[1px] bg-gray-900" />
      </div>

      <div className="relative rounded-md border bg-white/60 p-4">
        {/* Blurred/skeleton preview grid */}
        <div className="pointer-events-none select-none opacity-60 blur-[1px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="rounded-md border bg-white p-3 shadow-sm" key={i}>
                <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
                <div className="mb-2 h-5 w-11/12 rounded bg-gray-200" />
                <div className="mb-2 h-5 w-10/12 rounded bg-gray-200" />
                <div className="mb-2 h-3 w-2/3 rounded bg-gray-200" />
                <div className="relative h-[120px] w-full overflow-hidden rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Lock overlay */}
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <IoLockClosed className="text-gray-800" size={20} />
          </div>
          <div className="mx-4 max-w-xl text-center">
            <h3 className="font-bold text-gray-900 text-lg">
              Sign Up to unlock access to the Personalized News Feed and much
              more
            </h3>
            <div className="mt-5">
              <Button asChild variant="default">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
