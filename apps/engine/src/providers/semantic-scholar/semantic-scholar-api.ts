import type { SemanticScholarError, SemanticScholarPaper } from "./types";

export interface PaperData {
  id: string;
  title: string;
  abstract: string;
  authors: Array<{
    id: string;
    name: string;
  }>;
  year?: number;
  venue?: string;
  citationCount: number;
  referenceCount: number;
  fieldsOfStudy: string[];
  externalIds: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
  };
  isOpenAccess: boolean;
  pdfUrl?: string;
  url: string;
  publishedDate?: string;
}

/**
 * Semantic Scholar API client
 * Free academic paper search and metadata API
 */
export class SemanticScholarAPI {
  private baseUrl = "https://api.semanticscholar.org/graph/v1";

  /**
   * Extract paper ID from various Semantic Scholar URL formats
   * Supports:
   * - https://www.semanticscholar.org/paper/TITLE/PAPER_ID
   * - https://www.semanticscholar.org/paper/PAPER_ID
   * - Paper ID directly
   */
  extractPaperId(urlOrId: string): string {
    // If it's already a paper ID (40-character hex string)
    if (/^[a-f0-9]{40}$/i.test(urlOrId)) {
      return urlOrId;
    }

    // Extract from URL
    const match = urlOrId.match(/\/paper\/(?:[^/]+\/)?([a-f0-9]{40})/i);
    if (match?.[1]) {
      return match[1];
    }

    // Try to extract DOI or ArXiv ID from URL
    const doiMatch = urlOrId.match(/10\.\d{4,}\/[^\s]+/);
    if (doiMatch) {
      return `DOI:${doiMatch[0]}`;
    }

    const arxivMatch = urlOrId.match(/arxiv\.org\/abs\/([0-9.]+)/i);
    if (arxivMatch) {
      return `ARXIV:${arxivMatch[1]}`;
    }

    throw new Error(`Could not extract paper ID from: ${urlOrId}`);
  }

  /**
   * Check if URL is a Semantic Scholar URL
   */
  isSemanticScholarUrl(url: string): boolean {
    return url.includes("semanticscholar.org");
  }

  /**
   * Get paper details by ID
   * Can accept: Semantic Scholar ID, DOI, ArXiv ID, etc.
   */
  async getPaper(paperId: string): Promise<PaperData> {
    const fields = [
      "paperId",
      "title",
      "abstract",
      "authors",
      "year",
      "venue",
      "citationCount",
      "referenceCount",
      "influentialCitationCount",
      "fieldsOfStudy",
      "s2FieldsOfStudy",
      "publicationDate",
      "externalIds",
      "isOpenAccess",
      "openAccessPdf",
      "url",
    ].join(",");

    const url = `${this.baseUrl}/paper/${encodeURIComponent(paperId)}?fields=${fields}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Zeke Research Engine/1.0 (+https://zekehq.com)",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Paper not found: ${paperId}`);
      }
      const error = (await response.json().catch(() => ({
        error: "Unknown error",
      }))) as SemanticScholarError;
      throw new Error(
        `Semantic Scholar API error: ${error.message || error.error}`,
      );
    }

    const paper = (await response.json()) as SemanticScholarPaper;

    return {
      id: paper.paperId,
      title: paper.title,
      abstract: paper.abstract || "",
      authors:
        paper.authors?.map((a) => ({
          id: a.authorId,
          name: a.name,
        })) || [],
      year: paper.year,
      venue: paper.venue,
      citationCount: paper.citationCount || 0,
      referenceCount: paper.referenceCount || 0,
      fieldsOfStudy: [
        ...(paper.fieldsOfStudy || []),
        ...(paper.s2FieldsOfStudy?.map((f) => f.category) || []),
      ],
      externalIds: {
        DOI: paper.externalIds?.DOI,
        ArXiv: paper.externalIds?.ArXiv,
        PubMed: paper.externalIds?.PubMed,
      },
      isOpenAccess: paper.isOpenAccess || false,
      pdfUrl: paper.openAccessPdf?.url,
      url: paper.url,
      publishedDate: paper.publicationDate,
    };
  }

  /**
   * Search for papers by query
   */
  async searchPapers(
    query: string,
    limit = 10,
  ): Promise<SemanticScholarPaper[]> {
    const url = new URL(`${this.baseUrl}/paper/search`);
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set(
      "fields",
      "paperId,title,abstract,authors,year,citationCount",
    );

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Zeke Research Engine/1.0 (+https://zekehq.com)",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Semantic Scholar search failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as { data: SemanticScholarPaper[] };
    return data.data || [];
  }

  /**
   * Health check - verify API is accessible
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Test with a known paper (Attention Is All You Need - Transformer paper)
      await this.getPaper("204e3073870fae3d05bcbc2f6a8e263d9b72e776");
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
