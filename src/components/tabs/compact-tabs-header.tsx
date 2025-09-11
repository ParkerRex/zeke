"use client";
import TabsStrip from "@/components/tabs/tabs-strip";

export default function CompactTabsHeader() {
  return (
    <header className="flex h-11 items-center gap-2 border-b bg-[##1C1B22] px-2">
      <div className="flex min-w-0 flex-1 overflow-hidden">
        <TabsStrip />
      </div>
    </header>
  );
}
