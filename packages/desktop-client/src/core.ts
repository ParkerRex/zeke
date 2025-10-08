export { invoke } from "@tauri-apps/api/core";
export { emit, listen } from "@tauri-apps/api/event";
export { getCurrentWindow, Window } from "@tauri-apps/api/window";

export async function openUrl(url: string) {
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
