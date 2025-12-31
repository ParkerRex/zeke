"use client";
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useCarousel } from "@zeke/ui/carousel";
import { parseAsString, useQueryStates } from "nuqs";
import { useHotkeys } from "react-hotkeys-hook";

export function WidgetsNavigation() {
  const { scrollPrev, scrollNext } = useCarousel();
  const [params] = useQueryStates({
    selectedDate: parseAsString,
  });

  const disabled = params.selectedDate;

  useHotkeys("left", scrollPrev, {
    enabled: !disabled,
  });

  useHotkeys("right", scrollNext, {
    enabled: !disabled,
  });

  return null;
}
