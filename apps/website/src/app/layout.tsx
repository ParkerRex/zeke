import { DevMessage } from "@/components/dev-message";
import { Footer } from "@/components/footer";
import { FooterCTA } from "@/components/footer-cta";
import { Header } from "@/components/header";
import "@/styles/globals.css";
import { cn } from "@zeke/ui/cn";
import "@zeke/ui/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Provider as Analytics } from "@zeke/events/client";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { baseUrl } from "./sitemap";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Zeke | From 10 hours to 5 minutes—without missing what matters",
    template: "%s | Zeke",
  },
  description:
    "Turn podcasts, papers, videos, and posts into verified briefs—and into the exact docs and content your business needs. Research made effortless.",
  openGraph: {
    title: "Zeke | From 10 hours to 5 minutes—without missing what matters",
    description:
      "Turn podcasts, papers, videos, and posts into verified briefs—and into the exact docs and content your business needs. Research made effortless.",
    url: baseUrl,
    siteName: "Zeke",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://cdn.zekehq.com/opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.zekehq.com/opengraph-image.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
  twitter: {
    title: "Zeke | From 10 hours to 5 minutes—without missing what matters",
    description:
      "Turn podcasts, papers, videos, and posts into verified briefs—and into the exact docs and content your business needs. Research made effortless.",
    images: [
      {
        url: "https://cdn.zekehq.com/opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.zekehq.com/opengraph-image.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default function Layout({ children }: { children: ReactElement }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable}`,
          "bg-[#fbfbfb] dark:bg-[#0C0C0C] overflow-x-hidden font-sans antialiased",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="container mx-auto px-4 overflow-hidden md:overflow-visible">
            {children}
          </main>
          <FooterCTA />
          <Footer />
          <Analytics />
          <DevMessage />
        </ThemeProvider>
      </body>
    </html>
  );
}
