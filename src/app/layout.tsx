import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Hubot_Sans } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/utils/cn";

import "@/styles/globals.css";

export const dynamic = "force-dynamic";

const hubot = Hubot_Sans({
  variable: "--font-hubot-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ZEKE — VC‑grade AI research workspace",
    template: "%s — ZEKE",
  },
  description:
    "Open AI stories in tabs, overlay trust layers (Why it matters, 🌶 hype score, corroboration), and share annotated story views to make faster, confident decisions.",
  openGraph: {
    title: "ZEKE — VC‑grade AI research workspace",
    description:
      "Open AI stories in tabs, overlay trust layers (Why it matters, 🌶 hype score, corroboration), and share annotated story views to make faster, confident decisions.",
    url: "/",
    siteName: "ZEKE",
    images: [
      {
        url: "/hero-shape.png",
        width: 1200,
        height: 630,
        alt: "ZEKE workspace preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZEKE — VC‑grade AI research workspace",
    description:
      "Open AI stories in tabs, overlay trust layers (Why it matters, 🌶 hype score, corroboration), and share annotated story views to make faster, confident decisions.",
    images: ["/hero-shape.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body
        className={cn(
          "font-sans antialiased",
          hubot.variable
        )}
      >
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
