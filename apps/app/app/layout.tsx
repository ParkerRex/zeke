import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Hubot_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className={cn("font-sans antialiased", hubot.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <NuqsAdapter>{children}</NuqsAdapter>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
