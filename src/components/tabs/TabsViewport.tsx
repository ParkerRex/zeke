"use client";
import { useEffect } from "react";
import { useTabs } from "@/lib/tabsStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X } from "lucide-react";
import StoryTab from "./StoryTab";
import { useRouter, usePathname } from "next/navigation";

export default function TabsViewport() {
  const { tabs, activeId, setActive, closeTab } = useTabs();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!activeId) return;
    if (activeId.startsWith("share:")) {
      const id = activeId.split(":")[1];
      router.push(`/share/${id}`);
    } else {
      router.push(`/story/${activeId}`);
    }
  }, [activeId, router]);

  // If user navigates back to marketing or elsewhere, avoid breaking UI
  const isAppRoute = pathname?.startsWith("/story/") || pathname?.startsWith("/share/") || pathname === "/";

  if (!tabs.length) return <div className="p-6 text-muted-foreground">Open a story to begin.</div>;

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeId} onValueChange={setActive} className="w-full">
        <TabsList className="max-w-full overflow-x-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-2">
              <span className="truncate max-w-[220px]">{t.title}</span>
              <button
                aria-label={`Close ${t.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(t.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id} className="h-[calc(100vh-8rem)] p-0">
            <StoryTab tab={t} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

