'use client';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Sidebar from '@/components/shell/Sidebar';
import TabsStrip from '@/components/tabs/TabsStrip';
import { useTabs } from '@/lib/tabsStore';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import TabsContentViewport from '@/components/tabs/TabsContentViewport';
import { TooltipProvider } from '@/components/ui/tooltip';
import TodayFeedClient from '@/components/feed/TodayFeedClient';
import HomeSnapshot from '@/components/home/HomeSnapshot';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { IoMenu } from 'react-icons/io5';

export default function AppLayout({ children }: { children: ReactNode }) {
  // 3-pane layout: Rail | Sidebar Panel (route content) | Main viewer (tabs)
  const pathname = usePathname();
  const router = useRouter();
  const { sidePanelOpen, setSidePanelOpen } = useTabs();
  const isHome = pathname === '/home';
  const usesViewer =
    pathname === '/today' ||
    (pathname?.startsWith('/stories') ?? false) ||
    (pathname?.startsWith('/sector') ?? false) ||
    pathname === '/company' ||
    pathname === '/watchlists';
  // Show the sidebar panel for all viewer routes except stories (stories is a full-page experience)
  const showSidebarPanel = !isHome && !(pathname?.startsWith('/stories') ?? false) && usesViewer;

  return (
    <TooltipProvider delayDuration={400}>
      <div className='grid h-screen grid-cols-[64px_1fr] grid-rows-[auto_1fr]'>
        {/* Rail spans both rows */}
        <aside className='row-span-2 border-r bg-white'>
          <Sidebar />
        </aside>

        {/* Global top bar with tabs strip */}
        <header className='col-start-2 flex items-center gap-2 border-b p-2'>
          {/* Mobile: open sidebar panel in a sheet */}
          {showSidebarPanel && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='ghost' size='sm' className='sm:hidden'>
                  <IoMenu className='mr-2 h-5 w-5' /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-full bg-white sm:max-w-md'>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                {/* Render the sidebar panel content inside the sheet on mobile */}
                <div className='mt-4 overflow-auto'>
                  {isHome ? <TodayFeedClient /> : showSidebarPanel ? children : null}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Back button (IDE-style) */}
          {usesViewer && (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  // Guard router.back with same-origin referrer; otherwise go to /stories
                  const ref = document.referrer;
                  let sameOrigin = false;
                  try {
                    const refUrl = ref ? new URL(ref) : null;
                    sameOrigin = !!(refUrl && refUrl.origin === window.location.origin);
                  } catch {}
                  if (window.history.length > 1 && sameOrigin) router.back();
                  else router.push('/stories');
                }
              }}
              className='hidden items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm text-gray-700 transition-colors hover:border-gray-200 hover:bg-white sm:inline-flex'
              aria-label='Back'
            >
              ← Back
            </button>
          )}

          {/* Tabs strip */}
          <div className='ml-1 flex min-w-0 flex-1 overflow-hidden'>
            <TabsStrip />
          </div>

          {/* Panel toggle */}
          {usesViewer && (
            <Button
              variant='ghost'
              size='sm'
              className='ml-1 hidden sm:inline-flex'
              onClick={() => setSidePanelOpen(!sidePanelOpen)}
              title={sidePanelOpen ? 'Hide side panel' : 'Show side panel'}
            >
              {sidePanelOpen ? <IoChevronForward className='h-5 w-5' /> : <IoChevronBack className='h-5 w-5' />}
            </Button>
          )}
        </header>

        {/* Row 2: two columns – sidebar panel + content */}
        <div
          className={
            'col-start-2 grid ' +
            (isHome
              ? 'grid-cols-1'
              : showSidebarPanel
              ? 'grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr]'
              : 'grid-cols-1')
          }
        >
          {showSidebarPanel && (
            <section className='hidden overflow-auto border-r bg-gray-50 sm:block'>{children}</section>
          )}
          <main className='h-full min-w-0'>
            {isHome ? <HomeSnapshot /> : usesViewer ? <TabsContentViewport /> : (children as any)}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
