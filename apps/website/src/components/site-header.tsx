"use client";

import { Button } from "@zeke/ui/button";
import { ModeToggle } from "@zeke/ui/components/mode-toggle";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@zeke/ui/navigation-menu";
import { Icons } from "@zeke/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import Logo from "./logo.svg";

interface NavigationLink {
  title: string;
  href: string;
}

interface NavigationItem {
  title: string;
  description?: string;
  href?: string;
  items?: NavigationLink[];
}

const defaultNavigation: ReadonlyArray<NavigationItem> = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Product",
    description: "Research intelligence that compresses hours into minutes.",
    items: [
      {
        title: "Pricing",
        href: "/pricing",
      },
    ],
  },
  {
    title: "Blog",
    href: "/blog",
  },
];

const docsNavigation: NavigationItem = {
  title: "Docs",
  description: "Dive into setup guides and API references.",
};

export function SiteHeader(): JSX.Element {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const hasDocsLink = Boolean(env.NEXT_PUBLIC_DOCS_URL);

  const navigationItems = useMemo<NavigationItem[]>(() => {
    if (!hasDocsLink || !env.NEXT_PUBLIC_DOCS_URL) {
      return [...defaultNavigation];
    }

    return [
      ...defaultNavigation,
      {
        ...docsNavigation,
        href: env.NEXT_PUBLIC_DOCS_URL,
      },
    ];
  }, [hasDocsLink]);

  const ctaLabel = "Talk to sales";
  const contactLabel = "Contact";
  const signInLabel = "Sign in";
  const signUpLabel = "Sign up";

  return (
    <header className="sticky top-0 left-0 z-40 w-full border-b bg-background">
      <div className="container relative mx-auto flex min-h-20 flex-row items-center gap-4 lg:grid lg:grid-cols-3">
        <div className="hidden flex-row items-center justify-start gap-4 lg:flex">
          <NavigationMenu className="flex items-start justify-start">
            <NavigationMenuList className="flex flex-row justify-start gap-4">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <NavigationMenuLink asChild>
                      <Button variant="ghost" asChild>
                        <Link href={item.href}>{item.title}</Link>
                      </Button>
                    </NavigationMenuLink>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="font-medium text-sm">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[450px] p-4">
                        <div className="flex grid-cols-2 flex-col gap-4 lg:grid">
                          <div className="flex h-full flex-col justify-between">
                            <div className="flex flex-col">
                              <p className="text-base">{item.title}</p>
                              <p className="text-muted-foreground text-sm">
                                {item.description}
                              </p>
                            </div>
                            <Button size="sm" className="mt-10" asChild>
                              <Link href="/contact">{ctaLabel}</Link>
                            </Button>
                          </div>
                          <div className="flex h-full flex-col justify-end text-sm">
                            {item.items?.map((subItem) => (
                              <NavigationMenuLink
                                key={subItem.title}
                                href={subItem.href}
                                className="flex flex-row items-center justify-between rounded px-4 py-2 hover:bg-muted"
                              >
                                <span>{subItem.title}</span>
                                <Icons.MoveRight className="h-4 w-4 text-muted-foreground" />
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-2 lg:justify-center">
          <Image
            src={Logo}
            alt="ZEKE logo"
            width={24}
            height={24}
            className="dark:invert"
          />
          <p className="whitespace-nowrap font-semibold">next-forge</p>
        </div>
        <div className="flex w-full justify-end gap-4">
          <Button variant="ghost" className="hidden md:inline" asChild>
            <Link href="/contact">{contactLabel}</Link>
          </Button>
          <div className="hidden border-r md:inline" />
          <div className="hidden md:inline">
            <ModeToggle />
          </div>
          <Button variant="outline" asChild className="hidden md:inline">
            <Link href={`${env.NEXT_PUBLIC_APP_URL}/sign-in`}>
              {signInLabel}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`${env.NEXT_PUBLIC_APP_URL}/sign-up`}>
              {signUpLabel}
            </Link>
          </Button>
        </div>
        <div className="flex w-12 shrink items-end justify-end lg:hidden">
          <Button variant="ghost" onClick={() => setMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <Icons.Close className="h-5 w-5" />
            ) : (
              <Icons.Menu className="h-5 w-5" />
            )}
          </Button>
          {isMenuOpen && (
            <div className="container absolute top-20 right-0 flex w-full flex-col gap-8 border-t bg-background py-4 shadow-lg">
              {navigationItems.map((item) => (
                <div key={item.title} className="flex flex-col gap-2">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center justify-between"
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        item.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      <span className="text-lg">{item.title}</span>
                      <Icons.MoveRight className="h-4 w-4 stroke-1 text-muted-foreground" />
                    </Link>
                  ) : (
                    <p className="text-lg">{item.title}</p>
                  )}
                  {item.items?.map((subItem) => (
                    <Link
                      key={subItem.title}
                      href={subItem.href}
                      className="flex items-center justify-between text-muted-foreground"
                    >
                      <span>{subItem.title}</span>
                      <Icons.MoveRight className="h-4 w-4 stroke-1" />
                    </Link>
                  ))}
                </div>
              ))}
              <div className="flex flex-col gap-3">
                <Button variant="secondary" asChild>
                  <Link href="/contact">{contactLabel}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`${env.NEXT_PUBLIC_APP_URL}/sign-in`}>
                    {signInLabel}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`${env.NEXT_PUBLIC_APP_URL}/sign-up`}>
                    {signUpLabel}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
