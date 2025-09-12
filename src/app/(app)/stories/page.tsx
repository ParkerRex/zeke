import type { Metadata } from "next";

// Stories route is primarily rendered via the app layout's TabsContentViewport.
// We still provide metadata here for SEO/sharing and a minimal SSR shell.
export const metadata: Metadata = {
  title: "Stories • ZEKE",
  description:
    "Browse AI‑powered news stories with contextual insights and summaries.",
  alternates: { canonical: "/stories" },
};

export default function StoriesPage() {
  // Minimal SSR shell; layout replaces content at runtime with the viewer.
  return (
    <div aria-hidden className="sr-only">
      Stories
    </div>
  );
}
