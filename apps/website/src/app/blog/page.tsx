import { getBlogPosts } from "@/lib/blog";
import { createMetadata } from "@/lib/metadata";
import { cn } from "@zeke/ui/cn";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = createMetadata({
  title: "ZEKE Blog",
  description:
    "Research intelligence updates, product releases, and operator playbooks from the ZEKE team.",
});

export default function BlogIndex(): JSX.Element {
  const data = getBlogPosts();

  const posts = data.sort((a, b) => {
    if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
      return -1;
    }
    return 1;
  });

  return (
    <>
      <div className="w-full py-20 lg:py-40">
        <div className="container mx-auto flex flex-col gap-14">
          <div className="flex w-full flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="max-w-xl font-regular text-3xl tracking-tighter md:text-5xl">
              Insights, releases, and operator stories
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {posts.map((post, index) => (
              <Link
                href={`/blog/${post.slug}`}
                className={cn(
                  "flex cursor-pointer flex-col gap-4 hover:opacity-75",
                  !index && "md:col-span-2",
                )}
                key={post.slug}
              >
                {post.metadata.image && (
                  <img
                    src={post.metadata.image}
                    alt={post.metadata.title}
                    className="w-full h-auto"
                  />
                )}
                <div className="flex flex-row items-center gap-4">
                  <p className="text-muted-foreground text-sm">
                    {new Date(post.metadata.publishedAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                  {post.metadata.tag && (
                    <span className="text-muted-foreground text-sm">
                      {post.metadata.tag}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="max-w-3xl text-4xl tracking-tight">
                    {post.metadata.title}
                  </h3>
                  <p className="max-w-3xl text-base text-muted-foreground">
                    {post.metadata.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
