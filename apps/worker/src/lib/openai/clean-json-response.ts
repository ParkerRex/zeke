const JSON_CODE_BLOCK_START = /^```json\s*/i;
const JSON_CODE_BLOCK_END = /\s*```$/i;

export function cleanAndParseJSON(text: string): unknown {
  const cleaned = text
    .replace(JSON_CODE_BLOCK_START, "")
    .replace(JSON_CODE_BLOCK_END, "")
    .trim();
  return JSON.parse(cleaned);
}
