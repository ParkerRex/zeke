import { cn } from '@/utils/cn';
import {
  IoAlbums,
  IoBookmark,
  IoFlame,
  IoLink,
  IoList,
  IoLogoYoutube,
  IoNewspaper,
  IoShieldCheckmark,
} from 'react-icons/io5';

export function WorkspacePreview({ className }: { className?: string }) {
  return (
    <div className={cn('relative rounded-lg border border-zinc-800 bg-black/80 p-4 lg:p-6', className)}>
      {/* Top Tabs */}
      <div className='mb-3 flex flex-wrap items-center gap-2'>
        {[
          'OpenAI safety update',
          'Meta releases Llama 3.2',
          'Anthropic Claude 3.5',
        ].map((t, i) => (
          <div
            key={t}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm',
              i === 1 ? 'border-cyan-500/40 bg-cyan-500/10 text-white' : 'border-zinc-800 text-neutral-300'
            )}
          >
            {t}
          </div>
        ))}
        <div className='ml-auto flex items-center gap-2'>
          <button className='rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-neutral-300'>
            Share tab
          </button>
          <button className='rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-neutral-300'>
            <IoBookmark className='inline -mt-0.5' /> Bookmark
          </button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className='grid grid-cols-12 gap-4'>
        {/* Left Nav */}
        <aside className='col-span-12 h-full min-h-[120px] rounded-md border border-zinc-800 bg-zinc-950/60 p-3 sm:col-span-2'>
          <nav className='flex flex-col gap-2 text-sm'>
            {[
              { label: 'Today', icon: IoList },
              { label: 'Sector', icon: IoShieldCheckmark },
              { label: 'Company', icon: IoAlbums },
              { label: 'Tools', icon: IoNewspaper },
              { label: 'Leaderboards', icon: IoFlame },
            ].map(({ label, icon: Icon }, idx) => (
              <span
                key={label}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-neutral-300',
                  idx === 0 && 'bg-zinc-900 text-white'
                )}
              >
                <Icon size={16} className='text-neutral-400' /> {label}
              </span>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <section className='col-span-12 grid min-h-[320px] grid-cols-12 gap-4 sm:col-span-10'>
          {/* Embed */}
          <div className='col-span-12 min-h-[240px] rounded-md border border-zinc-800 bg-zinc-950/60 p-0 lg:col-span-8'>
            <div className='flex items-center justify-between border-b border-zinc-800 px-4 py-2'>
              <div className='flex items-center gap-2 text-sm text-neutral-300'>
                <IoLogoYoutube className='text-red-400' /> YouTube • Interview: Llama 3.2 demo
              </div>
              <button className='text-xs text-neutral-400'>Open source</button>
            </div>
            <div className='flex h-[220px] items-center justify-center text-neutral-500 lg:h-[300px]'>
              <span className='text-sm'>Embedded content preview</span>
            </div>
          </div>

          {/* Overlay Panel */}
          <div className='col-span-12 flex flex-col gap-3 rounded-md border border-zinc-800 bg-zinc-950/60 p-4 lg:col-span-4'>
            <div className='flex items-center justify-between'>
              <span className='font-alt text-sm text-white'>Overlay</span>
              <div className='flex items-center gap-2'>
                <button className='rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-neutral-300'>
                  Highlight
                </button>
                <button className='rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-neutral-300'>
                  Bookmark
                </button>
              </div>
            </div>
            <div>
              <div className='mb-1 text-xs uppercase tracking-wide text-neutral-400'>Why it matters</div>
              <ul className='ml-4 list-disc text-sm text-neutral-300'>
                <li>Clear near-term impact on open-source model adoption.</li>
                <li>Signals competitive pressure on closed model pricing.</li>
                <li>Potential shift in enterprise evaluation criteria.</li>
              </ul>
            </div>
            <div className='flex items-center gap-2'>
              <div className='text-xs uppercase tracking-wide text-neutral-400'>Hype score</div>
              <div className='flex items-center gap-1'>
                <IoFlame className='text-orange-400' />
                <IoFlame className='text-orange-400' />
                <IoFlame className='text-orange-400' />
                <IoFlame className='text-neutral-700' />
                <IoFlame className='text-neutral-700' />
                <span className='ml-1 text-xs text-neutral-400'>(3/5)</span>
              </div>
            </div>
            <div>
              <div className='mb-1 text-xs uppercase tracking-wide text-neutral-400'>Corroboration</div>
              <ul className='space-y-1 text-sm text-neutral-300'>
                <li className='flex items-center gap-2'>
                  <IoLink className='text-cyan-400' /> Reuters: Meta open-sources Llama 3.2
                </li>
                <li className='flex items-center gap-2'>
                  <IoLink className='text-cyan-400' /> HN: Discussion thread trending
                </li>
                <li className='flex items-center gap-2'>
                  <IoLink className='text-cyan-400' /> Blog: Early benchmarks analyzed
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

