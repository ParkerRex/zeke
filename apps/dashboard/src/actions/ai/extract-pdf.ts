"use server";

import fs from "node:fs/promises";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { pdfParse } from "pdf-parse";
import { z } from "zod";

/*
 * Prompt notebook (Claude desktop smoke test → docs/system-prompts/extract-pdf.md):
 * - Uses ContentAnalysis schema defined below.
 * - Enforces page-number citations inside every factual string.
 * - Returns JSON only; no markdown.
 *
 * Next moves before wiring deeper into the dashboard:
 * 1. Drop the Claude-tested system prompt into docs/system-prompts/extract-pdf.md and version it.
 * 2. Add a lightweight runtime validator here (align zod schema + citations check) before persisting.
 * 3. Record the raw PDF + JSON output in storage so downstream playbooks/SOP generators can reuse it.
 * 4. Extend saveExtractedContent once schema is stable (creators table, highlights, related graph edges).
 */

// Schema matching the system prompt
const CreatorSchema = z.object({
  name: z.string(),
  role: z
    .enum(["author", "host", "guest", "interviewer", "creator"])
    .optional(),
  context: z.string().optional(),
  credibility: z.string().optional(),
});

const RelatedItemSchema = z.object({
  title: z.string(),
  relationship: z.enum([
    "responds-to",
    "builds-on",
    "contradicts",
    "deep-dive",
    "summary-of",
  ]),
  url: z.string().optional(),
});

const ContentAnalysisSchema = z.object({
  title: z.string(),
  creators: z.array(CreatorSchema),
  contentType: z.literal("paper"),
  highlights: z.array(z.string()),
  calculatedConsumptionTime: z.string(),
  whyItMatters: z.string(),
  sauce: z.string(),
  keyTakeaways: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(),
  bestQuotes: z.array(z.string()).optional(),
  actionableInsights: z.array(z.string()).optional(),
  relatedContent: z.array(RelatedItemSchema).optional(),
});

export type ContentAnalysis = z.infer<typeof ContentAnalysisSchema>;

/**
 * Extract and analyze PDF content using LLM
 * Replaces traditional job-based PDF processing
 */
export async function extractPdfAction(
  pdfPath: string,
  options?: {
    saveToDatabase?: boolean;
    teamId?: string;
    userId?: string;
  },
): Promise<{
  success: boolean;
  data?: ContentAnalysis;
  error?: string;
}> {
  try {
    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);

    // Parse PDF to text
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;
    const pageCount = pdfData.numpages;

    // Load system prompt
    const systemPrompt = await fs.readFile(
      "/Users/parkerrex/Developer/projects/zeke/docs/system-prompts/extract-pdf.md",
      "utf-8",
    );

    // Generate analysis using LLM
    const { object: analysis } = await generateObject({
      model: openai("gpt-4o"),
      schema: ContentAnalysisSchema,
      system: systemPrompt,
      prompt: `Analyze this ${pageCount}-page research paper:

${pdfText}

Extract all key information according to the ContentAnalysis schema, ensuring every claim is cited with page numbers.`,
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    // Optionally save to database
    if (options?.saveToDatabase && options.teamId) {
      // Here you would save the extracted content to your database
      // This would replace the job-based processing
      await saveExtractedContent({
        analysis,
        teamId: options.teamId,
        userId: options.userId,
        originalPath: pdfPath,
      });
    }

    return {
      success: true,
      data: analysis,
    };
  } catch (error) {
    console.error("PDF extraction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract PDF",
    };
  }
}

/**
 * Save extracted content to database
 * This would integrate with your existing database schema
 */
async function saveExtractedContent(params: {
  analysis: ContentAnalysis;
  teamId: string;
  userId?: string;
  originalPath: string;
}) {
  const { analysis, teamId, userId } = params;

  // Example implementation - adapt to your schema
  // This would use your database client to:
  // 1. Create a source entry
  // 2. Create a story from the paper
  // 3. Extract highlights as individual records
  // 4. Link creators/authors
  // 5. Store metadata

  console.log("Would save to database:", {
    title: analysis.title,
    teamId,
    userId,
    highlightCount: analysis.highlights.length,
    takeawayCount: analysis.keyTakeaways.length,
  });

  // In production:
  // const db = createClient();
  // await db.insert(schema.sources).values({...});
  // await db.insert(schema.stories).values({...});
  // await db.insert(schema.highlights).values({...});
}

/**
 * Process multiple PDFs in parallel
 * Demonstrates replacing batch jobs with concurrent AI processing
 */
export async function extractPdfBatchAction(
  pdfPaths: string[],
  options?: {
    maxConcurrency?: number;
    saveToDatabase?: boolean;
    teamId?: string;
    userId?: string;
  },
): Promise<{
  success: boolean;
  results: Array<{
    path: string;
    success: boolean;
    data?: ContentAnalysis;
    error?: string;
  }>;
}> {
  const maxConcurrency = options?.maxConcurrency || 3;
  const results = [];

  // Process in chunks to avoid rate limits
  for (let i = 0; i < pdfPaths.length; i += maxConcurrency) {
    const chunk = pdfPaths.slice(i, i + maxConcurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (path) => {
        const result = await extractPdfAction(path, options);
        return {
          path,
          ...result,
        };
      }),
    );
    results.push(...chunkResults);
  }

  return {
    success: results.every((r) => r.success),
    results,
  };
}

/**
 * Extract PDF from URL
 * Downloads and processes in one step, no intermediate storage needed
 */
export async function extractPdfFromUrlAction(
  url: string,
  options?: {
    saveToDatabase?: boolean;
    teamId?: string;
    userId?: string;
  },
): Promise<{
  success: boolean;
  data?: ContentAnalysis;
  error?: string;
}> {
  try {
    // Fetch PDF from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    // Save to temporary file
    const buffer = Buffer.from(await response.arrayBuffer());
    const tempPath = `/tmp/${Date.now()}-${Math.random().toString(36)}.pdf`;
    await fs.writeFile(tempPath, buffer);

    // Extract content
    const result = await extractPdfAction(tempPath, options);

    // Clean up temp file
    await fs.unlink(tempPath).catch(() => {
      // Ignore cleanup errors
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to process PDF from URL",
    };
  }
}
