import { CustomMDX } from "@/components/mdx";
import { getBlogPosts } from "@/lib/blog";
import { createMetadata } from "@/lib/metadata";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";
const url = new URL(baseUrl);

type BlogPostProperties = {
  readonly params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const posts = getBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export const generateMetadata = async ({
  params,
}: BlogPostProperties): Promise<Metadata> => {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);

  if (!post) {
    return {};
  }

  return createMetadata({
    title: post.metadata.title,
    description: post.metadata.summary,
    image: post.metadata.image,
  });
};

const BlogPost = async ({ params }: BlogPostProperties) => {
  const { slug } = await params;

  const post = getBlogPosts().find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@type": "BlogPosting",
            "@context": "https://schema.org",
            datePublished: post.metadata.publishedAt,
            description: post.metadata.summary,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": new URL(`/blog/${post.slug}`, url).toString(),
            },
            headline: post.metadata.title,
            image: post.metadata.image,
            dateModified: post.metadata.publishedAt,
            isAccessibleForFree: true,
          }),
        }}
      />
      <div className="container mx-auto py-16">
        <Link
          className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm focus:underline focus:outline-none"
          href="/blog"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Blog
        </Link>
        <div className="mt-16 flex flex-col items-start gap-8 sm:flex-row">
          <div className="sm:flex-1">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <h1 className="scroll-m-20 text-balance font-extrabold text-4xl tracking-tight lg:text-5xl">
                {post.metadata.title}
              </h1>
              <p className="text-balance leading-7 [&:not(:first-child)]:mt-6">
                {post.metadata.summary}
              </p>
              {post.metadata.image ? (
                <img
                  src={post.metadata.image}
                  alt={post.metadata.title}
                  className="my-16 h-full w-full rounded-xl"
                />
              ) : undefined}
              <div className="mx-auto max-w-prose">
                <CustomMDX source={post.content} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
