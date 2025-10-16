import {
  IoAlbums,
  IoBookmark,
  IoFlame,
  IoLink,
  IoList,
  IoLogoYoutube,
  IoNewspaper,
  IoShieldCheckmark,
} from "react-icons/io5";

import { cn } from "@zeke/ui/cn";

export function WorkspacePreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-gray-200 bg-white/80 p-4 lg:p-6",
        className,
      )}
    >
      {/* Top Tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[
          "OpenAI safety update",
          "Meta releases Llama 3.2",
          "Anthropic Claude 3.5",
        ].map((t, i) => (
          <div
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm",
              i === 1
                ? "border-cyan-500/40 bg-cyan-500/10 text-black"
                : "border-gray-200 text-gray-700",
            )}
            key={t}
          >
            {t}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            aria-label="Share tab"
            className="cursor-pointer rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-gray-700 text-sm transition-all duration-150 hover:border-gray-300 hover:bg-gray-200"
            title="Share tab"
            type="button"
          >
            Share tab
          </button>
          <button
            aria-label="Bookmark tab"
            className="cursor-pointer rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-gray-700 text-sm transition-all duration-150 hover:border-gray-300 hover:bg-gray-200"
            title="Bookmark tab"
            type="button"
          >
            <IoBookmark className="-mt-0.5 inline" /> Bookmark
          </button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Nav */}
        <aside className="col-span-12 h-full min-h-[120px] rounded-md border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
          <nav className="flex flex-col gap-2 text-sm">
            {[
              { label: "Today", icon: IoList },
              { label: "Sector", icon: IoShieldCheckmark },
              { label: "Company", icon: IoAlbums },
              { label: "Tools", icon: IoNewspaper },
              { label: "Leaderboards", icon: IoFlame },
            ].map(({ label, icon: Icon }, idx) => (
              <span
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-gray-700 transition-all duration-150 hover:bg-gray-100",
                  idx === 0 && "bg-gray-100 text-black",
                )}
                key={label}
              >
                <Icon className="text-gray-500" size={16} /> {label}
              </span>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <section className="col-span-12 grid min-h-[320px] grid-cols-12 gap-4 sm:col-span-10">
          {/* Embed */}
          <div className="col-span-12 min-h-[240px] rounded-md border border-gray-200 bg-gray-50 p-0 lg:col-span-8">
            <div className="flex items-center justify-between border-gray-200 border-b px-4 py-2">
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <IoLogoYoutube className="text-red-400" /> YouTube • Interview:
                Llama 3.2 demo
              </div>
              <button
                aria-label="Open source"
                className="cursor-pointer text-gray-500 text-xs transition-all duration-150 hover:text-gray-700"
                title="Open source"
                type="button"
              >
                Open source
              </button>
            </div>
            <div className="flex h-[220px] items-center justify-center text-gray-500 lg:h-[300px]">
              <span className="text-sm">Embedded content preview</span>
            </div>
          </div>

          {/* Overlay Panel */}
          <div className="col-span-12 flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 lg:col-span-4">
            <div className="flex items-center justify-between">
              <span className="font-alt text-black text-sm">Overlay</span>
              <div className="flex items-center gap-2">
                <button
                  className="cursor-pointer rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-gray-700 text-xs transition-all duration-150 hover:border-gray-300 hover:bg-gray-200"
                  type="button"
                >
                  Highlight
                </button>
                <button
                  className="cursor-pointer rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-gray-700 text-xs transition-all duration-150 hover:border-gray-300 hover:bg-gray-200"
                  type="button"
                >
                  Bookmark
                </button>
              </div>
            </div>
            <div>
              <div className="mb-1 text-gray-500 text-xs uppercase tracking-wide">
                Why it matters
              </div>
              <ul className="ml-4 list-disc text-gray-700 text-sm">
                <li>Clear near-term impact on open-source model adoption.</li>
                <li>Signals competitive pressure on closed model pricing.</li>
                <li>Potential shift in enterprise evaluation criteria.</li>
              </ul>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-gray-500 text-xs uppercase tracking-wide">
                Hype score
              </div>
              <div className="flex items-center gap-1">
                <IoFlame className="text-orange-400" />
                <IoFlame className="text-orange-400" />
                <IoFlame className="text-orange-400" />
                <IoFlame className="text-gray-300" />
                <IoFlame className="text-gray-300" />
                <span className="ml-1 text-gray-500 text-xs">(3/5)</span>
              </div>
            </div>
            <div>
              <div className="mb-1 text-gray-500 text-xs uppercase tracking-wide">
                Corroboration
              </div>
              <ul className="space-y-1 text-gray-700 text-sm">
                <li className="flex items-center gap-2">
                  <IoLink className="text-cyan-400" /> Reuters: Meta
                  open-sources Llama 3.2
                </li>
                <li className="flex items-center gap-2">
                  <IoLink className="text-cyan-400" /> HN: Discussion thread
                  trending
                </li>
                <li className="flex items-center gap-2">
                  <IoLink className="text-cyan-400" /> Blog: Early benchmarks
                  analyzed
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
