export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
  lastBuildDate?: string;
  language?: string;
  image?: {
    url: string;
    title: string;
    link: string;
  };
}

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  author?: string;
  category?: string[];
  content?: string;
  enclosure?: {
    url: string;
    type: string;
    length: number;
  };
}

export class RSSAPI {
  async getFeed(url: string): Promise<RSSFeed> {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Zeke Research Engine/1.0 (+https://zekehq.com)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      throw new Error(
        `RSS fetch failed: ${response.status} ${response.statusText}`,
      );
    }

    const xmlText = await response.text();
    return this.parseRSS(xmlText, url);
  }

  private parseRSS(xmlText: string, feedUrl: string): RSSFeed {
    // Simple RSS parser - in production you'd use a proper XML parser
    const titleMatch = xmlText.match(
      /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/,
    );
    const descMatch = xmlText.match(
      /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/,
    );
    const linkMatch = xmlText.match(/<link>(.*?)<\/link>/);

    // Extract items
    const itemsRegex = /<item>([\s\S]*?)<\/item>/g;
    const items: RSSItem[] = [];

    for (const match of xmlText.matchAll(itemsRegex)) {
      const itemXml = match[1];

      const itemTitle = this.extractValue(itemXml, "title");
      const itemDesc = this.extractValue(itemXml, "description");
      const itemLink = this.extractValue(itemXml, "link");
      const itemPubDate = this.extractValue(itemXml, "pubDate");
      const itemGuid = this.extractValue(itemXml, "guid");
      const itemAuthor =
        this.extractValue(itemXml, "author") ||
        this.extractValue(itemXml, "dc:creator");

      if (itemTitle && itemLink) {
        items.push({
          title: itemTitle,
          description: itemDesc || "",
          link: itemLink,
          pubDate: itemPubDate || new Date().toISOString(),
          guid: itemGuid || itemLink,
          author: itemAuthor,
        });
      }
    }

    return {
      title: titleMatch?.[1] || titleMatch?.[2] || "Unknown Feed",
      description: descMatch?.[1] || descMatch?.[2] || "",
      link: linkMatch?.[1] || feedUrl,
      items,
    };
  }

  private extractValue(xml: string, tag: string): string {
    // Try CDATA first
    const cdataMatch = xml.match(
      new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>`, "s"),
    );
    if (cdataMatch) return this.cleanHtml(cdataMatch[1]);

    // Try normal tag
    const normalMatch = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "s"));
    if (normalMatch) return this.cleanHtml(normalMatch[1]);

    return "";
  }

  private cleanHtml(text: string): string {
    // Remove HTML tags and decode entities
    return text
      .replace(/<[^>]*>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .trim();
  }

  isValidRSSUrl(url: string): boolean {
    return (
      url.includes("/rss") ||
      url.includes("/feed") ||
      url.includes(".xml") ||
      url.includes("/atom") ||
      url.endsWith("/rss.xml") ||
      url.endsWith("/feed.xml") ||
      url.includes("hnrss.org") ||
      url.includes("feeds.")
    );
  }
}
