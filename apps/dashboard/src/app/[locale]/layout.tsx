import "@/styles/globals.css";
import { cn } from "@zeke/ui/cn";
import "@zeke/ui/globals.css";
import { Provider as Analytics } from "@zeke/events/client";
import { Toaster } from "@zeke/ui/toaster";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Lora } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactElement } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.zeke.ai"),
  title: "Zeke | From 10 hours to 5 minutes—without missing what matters",
  description:
    "Turn podcasts, papers, videos, and posts into verified briefs and ready-to-use business outputs with citations. Make research effortless.",
  twitter: {
    title: "Zeke | Give everyone pro-level research & applied-AI skills",
    description:
      "Discover the signal across podcasts, papers, videos, and posts. Instantly apply it to your goals and SOPs to produce briefs, plans, and content—grounded by receipts.",
    images: [
      {
        url: "https://cdn.zeke.ai/opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.zeke.ai/opengraph-image.jpg",
        width: 1800,
        height: 1600,
      },
    ],
  },
  openGraph: {
    title: "Zeke | Make research effortless",
    description:
      "Turn sprawling content into verified insights and ready-to-use outputs, fast. Go from 10 hours to 5 minutes without missing what matters.",
    url: "https://app.zeke.ai",
    siteName: "Zeke",
    images: [
      {
        url: "https://cdn.zeke.ai/opengraph-image.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://cdn.zeke.ai/opengraph-image.jpg",
        width: 1800,
        height: 1600,
      },
    ],
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

const lora = Lora({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export default async function Layout({
  children,
  params,
}: {
  children: ReactElement;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable} ${lora.variable} font-sans`,
          "whitespace-pre-line overscroll-none antialiased",
        )}
      >
        <NuqsAdapter>
          <Providers locale={locale}>{children}</Providers>
          <Toaster />
          <Analytics />
        </NuqsAdapter>
      </body>
    </html>
  );
}
