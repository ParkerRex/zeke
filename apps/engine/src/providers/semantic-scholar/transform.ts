import type { ContentItem, ContentSource } from "../types";
import type { PaperData } from "./semantic-scholar-api";

export function transformPaperToContent(
  paper: PaperData,
  originalUrl: string,
): ContentItem {
  return {
    id: paper.id,
    title: paper.title,
    description: paper.abstract,
    url: originalUrl,
    sourceType: "semantic-scholar",
    contentType: "paper",
    publishedAt: paper.publishedDate
      ? new Date(paper.publishedDate)
      : paper.year
        ? new Date(paper.year, 0, 1)
        : new Date(),
    metadata: {
      paperId: paper.id,
      citationCount: paper.citationCount,
      referenceCount: paper.referenceCount,
      fieldsOfStudy: paper.fieldsOfStudy,
      venue: paper.venue,
      year: paper.year,
      externalIds: paper.externalIds,
      isOpenAccess: paper.isOpenAccess,
      pdfUrl: paper.pdfUrl,
      authors: paper.authors.map((a) => a.name),
    },
    author: paper.authors[0]
      ? {
          id: paper.authors[0].id,
          name: paper.authors[0].name,
          url: `https://www.semanticscholar.org/author/${paper.authors[0].id}`,
        }
      : undefined,
  };
}

export function transformSemanticScholarToSource(): ContentSource {
  return {
    id: "semantic_scholar",
    name: "Semantic Scholar",
    description:
      "Free, AI-powered research tool for scientific literature, built by the Allen Institute for AI",
    url: "https://www.semanticscholar.org",
    sourceType: "semantic-scholar",
    metadata: {
      type: "academic_database",
      paperCount: 200000000, // 200M+ papers as of 2024
    },
    isActive: true,
    lastChecked: new Date(),
  };
}