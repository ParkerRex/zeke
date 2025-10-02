import type { Metadata } from "next";

type MetadataConfig = {
  title: string;
  description: string;
  image?: string;
};

export function createMetadata({
  title,
  description,
  image,
}: MetadataConfig): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
