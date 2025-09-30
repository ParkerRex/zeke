import type { Database } from "@db/client";
// import { shortLinks, teams } from "@db/schema"; // TODO: Create short_links table when needed
import { teams } from "@db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type ShortLink = {
  id: string;
  shortId: string;
  url: string;
  teamId: string;
  userId: string;
  createdAt: string;
};

export async function getShortLinkByShortId(db: Database, shortId: string) {
  // TODO: Implement when short_links table is created
  // For now, return null (no short link found)
  return null;
}

type CreateShortLinkData = {
  url: string;
  teamId: string;
  userId: string;
  type: "redirect" | "download";
  fileName?: string;
  mimeType?: string;
  size?: number;
  expiresAt?: string;
};

export async function createShortLink(db: Database, data: CreateShortLinkData) {
  // TODO: Implement when short_links table is created
  // For now, return a mock short link
  const shortId = nanoid(8);

  return {
    id: crypto.randomUUID(),
    shortId,
    url: data.url,
    type: data.type,
    fileName: data.fileName || null,
    mimeType: data.mimeType || null,
    size: data.size || null,
    createdAt: new Date().toISOString(),
    expiresAt: data.expiresAt || null,
  };
}
