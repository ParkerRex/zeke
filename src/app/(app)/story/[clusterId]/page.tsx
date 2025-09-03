"use client";
import { useEffect } from "react";

import { useTabs } from "@/lib/tabsStore";

export default function StoryRoute({ params }: { params: { clusterId: string } }) {
  const { restoreFromUrl, setActive } = useTabs();
  const id = params.clusterId;

  useEffect(() => {
    let mounted = true;
    (async () => {
      await restoreFromUrl(id, false);
      if (mounted) setActive(id);
    })();
    return () => {
      mounted = false;
    };
  }, [id, restoreFromUrl, setActive]);

  return null;
}

