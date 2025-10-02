import Link from "next/link";

interface FooterLink {
  title: string;
  href: string;
}

interface FooterNavigationItem {
  title: string;
  description: string;
  href?: string;
  items?: FooterLink[];
}

const navigationItems: FooterNavigationItem[] = [
  {
    title: "Home",
    description: "Discover the ZEKE research intelligence platform.",
    href: "/",
  },
  {
    title: "Pages",
    description: "Explore our blog, releases, and customer stories.",
    items: [
      {
        title: "Blog",
        href: "/blog",
      },
      ...(process.env.NEXT_PUBLIC_DOCS_URL
        ? [{ title: "Docs", href: process.env.NEXT_PUBLIC_DOCS_URL }]
        : []),
    ],
  },
  {
    title: "Legal",
    description: "Stay informed about our policies and commitments.",
    items: [
      {
        title: "Terms of Service",
        href: "/terms",
      },
      {
        title: "Privacy Policy",
        href: "/policy",
      },
      {
        title: "Support",
        href: "/support",
      },
    ],
  },
];

export function SiteFooter(): JSX.Element {
  return (
    <section className="dark border-foreground/10 border-t">
      <div className="w-full bg-background py-20 text-foreground lg:py-40">
        <div className="container mx-auto">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-8">
              <div className="flex flex-col gap-2">
                <h2 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
                  ZEKE
                </h2>
                <p className="max-w-lg text-left text-foreground/75 text-lg leading-relaxed tracking-tight">
                  Compress research from 10 hours to 5 minutes.
                </p>
              </div>
            </div>
            <div className="grid items-start gap-10 lg:grid-cols-3">
              {navigationItems.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col items-start gap-1 text-base"
                >
                  <div className="flex flex-col gap-2">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="flex items-center justify-between"
                        target={
                          item.href.includes("http") ? "_blank" : undefined
                        }
                        rel={
                          item.href.includes("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        <span className="text-xl">{item.title}</span>
                      </Link>
                    ) : (
                      <p className="text-xl">{item.title}</p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                    {item.items?.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className="flex items-center justify-between"
                        target={
                          subItem.href.includes("http") ? "_blank" : undefined
                        }
                        rel={
                          subItem.href.includes("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        <span className="text-foreground/75">
                          {subItem.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
