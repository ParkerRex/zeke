import type { ReactNode } from 'react';

import Sidebar from '@/components/shell/Sidebar';
import TabsViewport from '@/components/tabs/TabsViewport';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className='flex h-screen'>
      <Sidebar />
      <main className='flex flex-1 flex-col'>
        <div className='flex items-center gap-2 border-b p-2'>
          <div className='font-medium'>Workspace</div>
          <div className='ml-auto text-sm text-muted-foreground'>Figma-style tabs</div>
        </div>
        <div className='grid flex-1 grid-rows-[auto_1fr]'>
          <div className='border-b'>
            <TabsViewport />
          </div>
          <div className='overflow-auto'>{children}</div>
        </div>
      </main>
    </div>
  );
}
