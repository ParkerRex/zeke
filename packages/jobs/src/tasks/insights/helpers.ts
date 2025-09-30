import { hashText } from "../../utils/url/hashText";

type InsightLike = {
  summary?: string | null;
  quote?: string | null;
};

function normalize(value?: string | null): string {
  return value ? value.trim().toLowerCase() : "";
}

export function buildInsightKey(input: InsightLike): string | null {
  const parts = [normalize(input.summary), normalize(input.quote)].filter(
    Boolean,
  );
  if (parts.length === 0) {
    return null;
  }
  return hashText(parts.join("|"));
}
