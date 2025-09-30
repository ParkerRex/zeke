/**
 * arXiv API client
 * Uses the free arXiv API - no authentication required
 * Docs: https://arxiv.org/help/api/
 */

export interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  authors: ArxivAuthor[];
  published: string;
  updated: string;
  categories: string[];
  pdfUrl: string;
  doi?: string;
  journalRef?: string;
  comment?: string;
}

export interface ArxivAuthor {
  name: string;
  affiliation?: string;
}

export class ArxivAPI {
  private baseUrl = "http://export.arxiv.org/api/query";

  /**
   * Fetch paper details by arXiv ID
   */
  async getPaper(arxivId: string): Promise<ArxivEntry> {
    const url = `${this.baseUrl}?id_list=${arxivId}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Zeke Research Engine/1.0 (+https://zekehq.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xml = await response.text();

    // Check for errors in the XML
    if (xml.includes("<entry/>") || !xml.includes("<entry>")) {
      throw new Error(`Paper not found: ${arxivId}`);
    }

    return this.parseEntry(xml);
  }

  /**
   * Search arXiv papers
   */
  async search(
    query: string,
    maxResults = 10,
  ): Promise<{ entries: ArxivEntry[]; totalResults: number }> {
    const url = `${this.baseUrl}?search_query=${encodeURIComponent(query)}&max_results=${maxResults}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Zeke Research Engine/1.0 (+https://zekehq.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xml = await response.text();
    const totalMatch = xml.match(
      /<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/,
    );
    const totalResults = totalMatch ? Number.parseInt(totalMatch[1], 10) : 0;

    const entries = this.parseMultipleEntries(xml);

    return { entries, totalResults };
  }

  /**
   * Extract arXiv ID from various URL formats
   */
  extractArxivId(url: string): string | null {
    // Support various arXiv URL formats
    const patterns = [
      /arxiv\.org\/abs\/([0-9]+\.[0-9]+(?:v[0-9]+)?)/,
      /arxiv\.org\/pdf\/([0-9]+\.[0-9]+)(?:\.pdf)?/,
      /arxiv\.org\/(?:ps|ps_cache|pdf)\/([a-z-]+\/[0-9]+)/,
      /([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1].replace(".pdf", "");
      }
    }

    return null;
  }

  /**
   * Validate arXiv URL
   */
  isValidArxivUrl(url: string): boolean {
    return this.extractArxivId(url) !== null || url.includes("arxiv.org");
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}?search_query=cat:cs.AI&max_results=1`,
      );
      if (response.ok) {
        return { healthy: true, message: "arXiv API is accessible" };
      }
      return {
        healthy: false,
        message: `arXiv API returned ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse a single entry from XML
   */
  private parseEntry(xml: string): ArxivEntry {
    // Extract entry XML (between <entry> and </entry>)
    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) {
      throw new Error("No entry found in response");
    }

    const entryXml = entryMatch[1];

    // Extract ID
    const idMatch = entryXml.match(/<id>(.*?)<\/id>/);
    const fullId = idMatch?.[1] || "";
    const arxivId = fullId.split("/abs/").pop() || "";

    // Extract title (remove newlines and extra spaces)
    const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim() || "Unknown";

    // Extract summary
    const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
    const summary = summaryMatch?.[1]?.replace(/\s+/g, " ").trim() || "";

    // Extract authors
    const authorRegex = /<name>(.*?)<\/name>/g;
    const authors: ArxivAuthor[] = [];
    for (const match of entryXml.matchAll(authorRegex)) {
      authors.push({ name: match[1].trim() });
    }

    // Extract dates
    const publishedMatch = entryXml.match(/<published>(.*?)<\/published>/);
    const updatedMatch = entryXml.match(/<updated>(.*?)<\/updated>/);

    // Extract categories
    const categoryRegex = /<category[^>]+term="([^"]+)"/g;
    const categories: string[] = [];
    for (const match of entryXml.matchAll(categoryRegex)) {
      categories.push(match[1]);
    }

    // Extract DOI if present
    const doiMatch = entryXml.match(/<arxiv:doi[^>]*>(.*?)<\/arxiv:doi>/);

    // Extract journal reference if present
    const journalMatch = entryXml.match(
      /<arxiv:journal_ref[^>]*>(.*?)<\/arxiv:journal_ref>/,
    );

    // Extract comment if present
    const commentMatch = entryXml.match(
      /<arxiv:comment[^>]*>(.*?)<\/arxiv:comment>/,
    );

    return {
      id: arxivId,
      title,
      summary,
      authors,
      published: publishedMatch?.[1] || new Date().toISOString(),
      updated: updatedMatch?.[1] || new Date().toISOString(),
      categories,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
      doi: doiMatch?.[1],
      journalRef: journalMatch?.[1],
      comment: commentMatch?.[1],
    };
  }

  /**
   * Parse multiple entries from XML
   */
  private parseMultipleEntries(xml: string): ArxivEntry[] {
    const entries: ArxivEntry[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;

    for (const match of xml.matchAll(entryRegex)) {
      try {
        const entryXml = `<entry>${match[1]}</entry>`;
        const entry = this.parseEntry(entryXml);
        entries.push(entry);
      } catch (error) {
        console.warn("Failed to parse arXiv entry:", error);
      }
    }

    return entries;
  }
}
