
'use client';
import { useEffect } from 'react';
import { X, Pin } from 'lucide-react';

import { useTabs } from '@/lib/tabsStore';
import { StoryKindIcon } from '@/components/stories/StoryKindIcon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

export default function TabsStrip() {
  const { tabs, activeId, setActive, closeTab, promoteTab, pinTab, closeOthers, closeToRight } = useTabs();
  const ytThumb = (url: string) => {
    try {
      const m = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      const id = m?.[1];
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
    } catch {
      return undefined;
    }
  };
  const domain = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  // Keyboard shortcuts: Cmd/Ctrl+1..9 to switch, Cmd/Ctrl+W to close
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === 'input' ||
        tag === 'textarea' ||
        el.isContentEditable ||
        el.closest('input,textarea,[contenteditable="true"]') !== null
      );
    };
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (isEditable(e.target)) return;
      // Close active tab
      if (e.key.toLowerCase() === 'w') {
        if (activeId) {
          e.preventDefault();
          closeTab(activeId);
        }
        return;
      }
      // Switch 1..9
      const idx = Number(e.key);
      if (!Number.isNaN(idx) && idx >= 1 && idx <= 9) {
        const target = tabs[idx - 1];
        if (target) {
          e.preventDefault();
          setActive(target.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, tabs, setActive, closeTab]);

  return (
    <TooltipProvider delayDuration={500}>
      <div className='flex min-w-0 items-center gap-2 overflow-hidden'>
        <div className='relative ml-0 flex min-w-0 flex-1 overflow-hidden'>
          {/* Scroll fade gradients */}
          <div className='pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent' />
          <div className='pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent' />
          <div className='no-scrollbar -mx-1 flex max-w-full flex-1 items-center overflow-x-auto px-1 select-none'>
          {tabs.map((t, idx) => (
            <div key={t.id} className='flex items-center'>
              <ContextMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ContextMenuTrigger asChild>
                      <div
                        title={t.title}
                        role='tab'
                        aria-selected={activeId === t.id}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setActive(t.id);
                        }}
                        className={`mr-1 flex flex-1 basis-[200px] min-w-[104px] max-w-[260px] items-center gap-2 rounded-[10px] border px-2.5 py-1 text-sm transition-all select-none ${
                          activeId === t.id
                            ? 'border-gray-200 bg-white text-gray-900 shadow-sm'
                            : 'border-transparent bg-gray-100 text-gray-700 hover:border-gray-300 hover:bg-white hover:shadow-sm'
                        } ${t.preview ? 'italic' : ''}`}
                    onClick={() => {
                      setActive(t.id);
                      if (t.preview) promoteTab(t.id); // single-click promotes
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      if (t.preview) promoteTab(t.id);
                    }}
                  >
                    <StoryKindIcon kind={t.embedKind} />
                    <span className='truncate'>{t.title}</span>
                    {t.pinned ? <Pin className='h-3.5 w-3.5 opacity-70' /> : null}
                    <button
                      type='button'
                      aria-label={`Close ${t.title}`}
                      className='ml-1 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100'
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(t.id);
                      }}
                    >
                      <X className='h-4 w-4 opacity-80 transition-opacity hover:opacity-100' />
                    </button>
                      </div>
                    </ContextMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side='bottom' className='w-[360px] bg-white p-0 text-gray-900 shadow-xl border'>
                    <div className='p-2'>
                      <div className='mb-2 flex items-center gap-2'>
                        <StoryKindIcon kind={t.embedKind} />
                        <div className='min-w-0 flex-1'>
                          <div className='truncate text-sm font-medium'>{t.title}</div>
                          <div className='truncate text-[11px] text-gray-500'>{domain(t.embedUrl)}</div>
                        </div>
                        {typeof (t as any).overlays?.chili === 'number' ? (
                          <div className='text-xs' aria-label='chili'>
                            {Array.from({ length: Math.max(0, Math.min(5, (t as any).overlays.chili)) }).map((_, i) => (
                              <span key={i}>🌶</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      {t.embedKind === 'youtube' ? (() => {
                        const src = ytThumb(t.embedUrl);
                        return src ? <img src={src} alt='' className='h-[150px] w-full rounded-md object-cover' /> : null;
                      })() : null}
                      <div className='mt-2 flex items-center justify-between text-[11px] text-gray-500'>
                        <span>{t.preview ? 'Preview' : t.pinned ? 'Pinned' : 'Open'}</span>
                        <span>Double‑click to keep open</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>

                <ContextMenuContent className='min-w-[180px]'>
                    {/* TODO(perf): consider batch updates if we ever support closing hundreds of tabs */}
                    <ContextMenuItem onSelect={() => closeTab(t.id)}>Close</ContextMenuItem>
                    <ContextMenuItem onSelect={() => closeToRight(t.id)}>Close to the right</ContextMenuItem>
                    <ContextMenuItem onSelect={() => closeOthers(t.id)}>Close others</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onSelect={() => pinTab(t.id, !t.pinned)}>{t.pinned ? 'Unpin' : 'Pin'}</ContextMenuItem>
                  </ContextMenuContent>
              </ContextMenu>
            </div>
          ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
