import type { ContentItem, ContentSource } from "../types";
import type { ArxivEntry } from "./arxiv-api";

/**
 * Transform arXiv entry to ContentItem
 */
export function transformPaperToContent(
  entry: ArxivEntry,
  originalUrl: string,
): ContentItem {
  // Primary author
  const primaryAuthor = entry.authors[0];

  return {
    id: `arxiv_${entry.id}`,
    title: entry.title,
    description: entry.summary,
    url: originalUrl,
    sourceType: "arxiv",
    contentType: "paper",
    publishedAt: new Date(entry.published),
    metadata: {
      arxivId: entry.id,
      pdfUrl: entry.pdfUrl,
      categories: entry.categories,
      authors: entry.authors.map((a) => a.name),
      doi: entry.doi,
      journalRef: entry.journalRef,
      comment: entry.comment,
      updated: entry.updated,
    },
    author: primaryAuthor
      ? {
          id: primaryAuthor.name.replace(/[^a-zA-Z0-9]/g, "_"),
          name: primaryAuthor.name,
          url: `https://arxiv.org/search/?searchtype=author&query=${encodeURIComponent(primaryAuthor.name)}`,
        }
      : undefined,
  };
}

/**
 * Transform arXiv to ContentSource
 */
export function transformArxivToSource(): ContentSource {
  return {
    id: "arxiv_org",
    name: "arXiv.org",
    description:
      "Open access to research papers in physics, mathematics, computer science, quantitative biology, quantitative finance, statistics, electrical engineering and systems science, and economics",
    url: "https://arxiv.org",
    sourceType: "arxiv",
    metadata: {
      type: "academic_repository",
      fields: [
        "Physics",
        "Mathematics",
        "Computer Science",
        "Quantitative Biology",
        "Quantitative Finance",
        "Statistics",
        "Electrical Engineering",
        "Economics",
      ],
      papersCount: "2.3M+",
    },
    isActive: true,
    lastChecked: new Date(),
  };
}
