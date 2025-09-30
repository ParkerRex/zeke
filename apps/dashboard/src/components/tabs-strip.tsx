"use client";
import { toast } from "sonner";

function showUndoToast(count: number, onUndo: () => void) {
  if (count <= 0) {
    return;
  }
  toast(`Closed ${count} tab${count > 1 ? "s" : ""}`, {
    action: {
      label: "Undo",
      onClick: onUndo,
    },
  });
}

export default function TabsStrip() {
  return <div>Tabs Strip Component</div>;
}
