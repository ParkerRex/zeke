"use client";
import { useEffect } from "react";

import { useTabs } from "@/stores/tabsStore";

export default function ShareClient({ id }: { id: string }) {
  const { restoreFromUrl, setActive } = useTabs();

  useEffect(() => {
    let mounted = true;
    (async () => {
      await restoreFromUrl(id, true);
      if (mounted) setActive(`share:${id}`);
    })();
    return () => {
      mounted = false;
    };
  }, [id, restoreFromUrl, setActive]);

  return null;
}
