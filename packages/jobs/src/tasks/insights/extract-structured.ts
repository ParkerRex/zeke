/**
 * Enhanced Highlight Extraction
 *
 * Extracts structured highlights from content:
 * - code_example: Code snippets, implementation examples
 * - code_change: Git diffs, breaking changes
 * - api_change: API updates, new endpoints
 * - metric: Performance numbers, benchmarks
 */

export interface StructuredHighlight {
  kind: "code_example" | "code_change" | "api_change" | "metric";
  title: string;
  quote: string; // The actual code/change/metric text
  summary: string; // Why it matters
  confidence: number; // 0.0-1.0
  metadata: Record<string, any>;
}

/**
 * Extract code examples from markdown code blocks
 */
export function extractCodeExamples(text: string): StructuredHighlight[] {
  const highlights: StructuredHighlight[] = [];

  // Match markdown code blocks: ```language\ncode\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [, language, code] = match;
    const trimmedCode = code.trim();

    // Skip trivial examples (< 2 lines or < 50 chars)
    if (trimmedCode.split('\n').length < 2 || trimmedCode.length < 50) {
      continue;
    }

    // Look for context before the code block (within 200 chars)
    const contextStart = Math.max(0, match.index - 200);
    const context = text.slice(contextStart, match.index);
    const contextLines = context.split('\n').slice(-3); // Last 3 lines

    highlights.push({
      kind: "code_example",
      title: `${language || 'Code'} Example`,
      quote: trimmedCode,
      summary: contextLines.join(' ').trim() || "Code implementation example",
      confidence: 0.85,
      metadata: {
        language: language || "unknown",
        lineCount: trimmedCode.split('\n').length,
        charCount: trimmedCode.length,
      },
    });
  }

  return highlights;
}

/**
 * Extract git diffs and code changes
 */
export function extractCodeChanges(text: string): StructuredHighlight[] {
  const highlights: StructuredHighlight[] = [];

  // Detect git diff-like patterns
  const patterns = [
    // +/- diff syntax
    /(?:^|\n)([\s\S]{0,100}?)((?:^[+-]\s+.+$\n?)+)/gm,
    // "was X, now Y" patterns
    /((?:was|changed from|replaced)\s+`([^`]+)`\s+(?:with|to|now)\s+`([^`]+)`)/gi,
    // Breaking change indicators
    /(breaking change|deprecated|removed|renamed)[:\s]+(.{20,200})/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const context = match[1] || "";

      highlights.push({
        kind: "code_change",
        title: "Code Change Detected",
        quote: fullMatch.trim(),
        summary: context.trim() || "Breaking change or code modification",
        confidence: 0.75,
        metadata: {
          type: fullMatch.toLowerCase().includes('breaking') ? 'breaking' : 'update',
          changeLength: fullMatch.length,
        },
      });
    }
  }

  return highlights;
}

/**
 * Extract API changes and new endpoints
 */
export function extractAPIChanges(text: string): StructuredHighlight[] {
  const highlights: StructuredHighlight[] = [];

  // API-related patterns
  const patterns = [
    // New endpoint patterns
    /(new\s+(?:endpoint|route|api)[:\s]+(?:GET|POST|PUT|DELETE|PATCH)?\s*[/`][\w/-]+)/gi,
    // Environment variable changes
    /((?:new|added|updated)\s+environment\s+variable[:\s]+[\w_]+)/gi,
    // API version changes
    /(api\s+version\s+[\d.]+)/gi,
    // Parameter changes
    /((?:added|new|updated)\s+(?:parameter|field|property)[:\s]+[\w_]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const matchText = match[1];

      // Get surrounding context (100 chars before/after)
      const contextStart = Math.max(0, match.index - 100);
      const contextEnd = Math.min(text.length, match.index + match[0].length + 100);
      const context = text.slice(contextStart, contextEnd);

      highlights.push({
        kind: "api_change",
        title: "API Update",
        quote: matchText,
        summary: context.split('\n')[0].trim(),
        confidence: 0.80,
        metadata: {
          changeType: matchText.toLowerCase().includes('environment') ? 'env_var' :
                     matchText.toLowerCase().includes('endpoint') ? 'endpoint' :
                     matchText.toLowerCase().includes('version') ? 'version' : 'parameter',
        },
      });
    }
  }

  return highlights;
}

/**
 * Extract metrics and performance numbers
 */
export function extractMetrics(text: string): StructuredHighlight[] {
  const highlights: StructuredHighlight[] = [];

  // Metric patterns
  const patterns = [
    // Performance metrics: "50% faster", "2x improvement"
    /([\d.]+[x×%]\s+(?:faster|slower|improvement|reduction|increase|decrease))/gi,
    // Time metrics: "from 500ms to 100ms"
    /((?:from|reduced)\s+[\d.]+(?:ms|s|seconds?|minutes?)\s+(?:to|down to)\s+[\d.]+(?:ms|s|seconds?|minutes?))/gi,
    // Token/cost metrics
    /([\d,]+\s+tokens?\s+(?:saved|reduced|increased|per|\/)|cost\s+(?:reduced|increased)\s+by\s+[\d.%]+)/gi,
    // Latency metrics: "p95 latency", "throughput of X"
    /(p\d{2}\s+latency[:\s]+[\d.]+(?:ms|s)|throughput[:\s]+[\d,]+(?:\/s|\/sec|per second))/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const metricText = match[1];

      // Get surrounding context for explanation
      const contextStart = Math.max(0, match.index - 150);
      const contextEnd = Math.min(text.length, match.index + match[0].length + 150);
      const context = text.slice(contextStart, contextEnd);

      highlights.push({
        kind: "metric",
        title: "Performance Metric",
        quote: metricText,
        summary: context.trim(),
        confidence: 0.85,
        metadata: {
          metricType: metricText.toLowerCase().includes('token') ? 'tokens' :
                     metricText.toLowerCase().includes('latency') ? 'latency' :
                     metricText.toLowerCase().includes('cost') ? 'cost' : 'performance',
        },
      });
    }
  }

  return highlights;
}

/**
 * Main extraction function - runs all extractors
 */
export function extractStructuredHighlights(text: string): StructuredHighlight[] {
  const allHighlights: StructuredHighlight[] = [
    ...extractCodeExamples(text),
    ...extractCodeChanges(text),
    ...extractAPIChanges(text),
    ...extractMetrics(text),
  ];

  // Deduplicate by quote
  const seen = new Set<string>();
  return allHighlights.filter(h => {
    const key = h.quote.slice(0, 100); // Use first 100 chars as key
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}