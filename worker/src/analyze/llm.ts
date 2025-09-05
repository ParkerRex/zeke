import OpenAI from 'openai';
import { getStoryWithContent, upsertStoryOverlay, upsertStoryEmbedding } from '../db.js';
import { log } from '../log.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback to stub mode if no API key is provided
const USE_OPENAI = !!process.env.OPENAI_API_KEY;

interface AnalysisResult {
  why_it_matters: string;
  chili: number;
  confidence: number;
  citations: any[];
}

interface EmbeddingResult {
  embedding: number[];
}

/**
 * Analyze a story and generate overlays (summary, scoring) and embeddings
 */
export async function runAnalyzeStory(storyId: string): Promise<void> {
  const story = await getStoryWithContent(storyId);
  if (!story) {
    throw new Error(`Story not found: ${storyId}`);
  }

  log('analyze_story_start', {
    comp: 'analyze',
    story_id: storyId,
    title: story.title,
    text_length: story.text.length,
  });

  try {
    // Generate analysis and embeddings
    const [analysis, embedding] = await Promise.all([generateAnalysis(story), generateEmbedding(story)]);

    // Store results in database
    await Promise.all([
      upsertStoryOverlay({
        story_id: storyId,
        why_it_matters: analysis.why_it_matters,
        chili: analysis.chili,
        confidence: analysis.confidence,
        citations: analysis.citations,
        model_version: USE_OPENAI ? 'gpt-4o-mini-v1' : 'stub-v1',
      }),
      upsertStoryEmbedding({
        story_id: storyId,
        embedding: embedding.embedding,
        model_version: USE_OPENAI ? 'text-embedding-3-small-v1' : 'stub-v1',
      }),
    ]);

    log('analyze_story_success', {
      comp: 'analyze',
      story_id: storyId,
      chili: analysis.chili,
      confidence: analysis.confidence,
      embedding_dim: embedding.embedding.length,
    });
  } catch (error) {
    log(
      'analyze_story_error',
      {
        comp: 'analyze',
        story_id: storyId,
        error: String(error),
      },
      'error'
    );
    throw error;
  }
}

/**
 * Generate analysis overlays for a story using OpenAI or fallback to stub
 */
async function generateAnalysis(story: {
  title: string | null;
  canonical_url: string | null;
  text: string;
}): Promise<AnalysisResult> {
  if (USE_OPENAI) {
    return await generateOpenAIAnalysis(story);
  } else {
    return await generateStubAnalysis(story);
  }
}

/**
 * Generate analysis using OpenAI GPT-4o-mini
 */
async function generateOpenAIAnalysis(story: {
  title: string | null;
  canonical_url: string | null;
  text: string;
}): Promise<AnalysisResult> {
  const domain = story.canonical_url ? new URL(story.canonical_url).hostname : 'unknown';

  // Truncate content if too long (GPT-4o-mini has ~128k token limit)
  const maxContentLength = 8000; // Conservative limit for content
  const truncatedText =
    story.text.length > maxContentLength ? story.text.substring(0, maxContentLength) + '...[truncated]' : story.text;

  const prompt = `Analyze this news article and provide insights in JSON format.

Title: ${story.title || 'No title'}
Source: ${domain}
Content: ${truncatedText}

Please respond with a JSON object containing:
1. "why_it_matters": A 2-3 bullet point explanation of why this story is significant (use • bullet points)
2. "chili": A score from 0-5 indicating how "hot" or important this story is (0=boring, 5=major breakthrough)
3. "confidence": A score from 0-1 indicating your confidence in the analysis (0=low confidence, 1=high confidence)

Consider factors like:
- Technological significance and innovation
- Potential impact on industry or society
- Source reliability (${domain})
- Timeliness and relevance
- Depth and quality of reporting

Respond only with valid JSON, no other text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Clean up the response - remove markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    // Validate and sanitize the response
    return {
      why_it_matters: String(parsed.why_it_matters || '• Analysis not available'),
      chili: Math.max(0, Math.min(5, Math.round(Number(parsed.chili) || 1))),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
      citations: [], // TODO: Extract citations from content
    };
  } catch (error) {
    log(
      'openai_analysis_error',
      {
        comp: 'analyze',
        error: String(error),
        story_id: story.title,
      },
      'error'
    );

    // Fallback to stub analysis if OpenAI fails
    return await generateStubAnalysis(story);
  }
}

/**
 * Fallback stub analysis implementation
 */
async function generateStubAnalysis(story: {
  title: string | null;
  canonical_url: string | null;
  text: string;
}): Promise<AnalysisResult> {
  const textLength = story.text.length;
  const titleWords = (story.title || '').toLowerCase().split(/\s+/);

  // Simple heuristics for demo purposes
  const hasImportantKeywords = titleWords.some((word) =>
    ['ai', 'artificial', 'intelligence', 'breakthrough', 'security', 'privacy', 'data'].includes(word)
  );

  const domain = story.canonical_url ? new URL(story.canonical_url).hostname : 'unknown';
  const isReliableSource = ['arstechnica.com', 'news.ycombinator.com'].includes(domain);

  // Generate why it matters based on content analysis
  let why_it_matters = '';
  if (hasImportantKeywords) {
    why_it_matters = '• This story covers emerging technology trends that could impact how we work and live\n';
    why_it_matters += '• The developments discussed may influence industry standards and practices\n';
    why_it_matters += '• Understanding these changes helps stay informed about technological progress';
  } else {
    why_it_matters = '• This story provides insights into current industry developments\n';
    why_it_matters += '• The information may be relevant for understanding market trends\n';
    why_it_matters += '• Staying informed about these topics helps with professional awareness';
  }

  // Calculate chili score (0-5) based on content characteristics
  let chili = 1;
  if (hasImportantKeywords) chili += 2;
  if (textLength > 2000) chili += 1;
  if (isReliableSource) chili += 1;
  chili = Math.min(chili, 5);

  // Calculate confidence (0-1) based on source reliability and content quality
  let confidence = 0.5;
  if (isReliableSource) confidence += 0.3;
  if (textLength > 1000) confidence += 0.1;
  if (story.title && story.title.length > 10) confidence += 0.1;
  confidence = Math.min(confidence, 1.0);

  return {
    why_it_matters,
    chili,
    confidence,
    citations: [], // TODO: Extract citations from content
  };
}

/**
 * Generate embeddings for a story using OpenAI or fallback to stub
 */
async function generateEmbedding(story: { title: string | null; text: string }): Promise<EmbeddingResult> {
  if (USE_OPENAI) {
    return await generateOpenAIEmbedding(story);
  } else {
    return await generateStubEmbedding(story);
  }
}

/**
 * Generate embeddings using OpenAI text-embedding-3-small
 */
async function generateOpenAIEmbedding(story: { title: string | null; text: string }): Promise<EmbeddingResult> {
  // Combine title and text for embedding
  const content = `${story.title || ''}\n\n${story.text}`;

  // Truncate if too long (text-embedding-3-small has ~8k token limit)
  const maxContentLength = 6000; // Conservative limit
  const truncatedContent =
    content.length > maxContentLength ? content.substring(0, maxContentLength) + '...[truncated]' : content;

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedContent,
      dimensions: 1536, // Use 1536 dimensions to match our database schema
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length !== 1536) {
      throw new Error(`Invalid embedding response: expected 1536 dimensions, got ${embedding?.length || 0}`);
    }

    return { embedding };
  } catch (error) {
    log(
      'openai_embedding_error',
      {
        comp: 'analyze',
        error: String(error),
        story_title: story.title,
      },
      'error'
    );

    // Fallback to stub embedding if OpenAI fails
    return await generateStubEmbedding(story);
  }
}

/**
 * Fallback stub embedding implementation
 */
async function generateStubEmbedding(story: { title: string | null; text: string }): Promise<EmbeddingResult> {
  // Stub implementation - generates a deterministic embedding based on content hash
  const content = `${story.title || ''} ${story.text}`.toLowerCase();
  const embedding = new Array(1536).fill(0);

  // Create a simple hash-based embedding for demo purposes
  for (let i = 0; i < content.length && i < 1536; i++) {
    const charCode = content.charCodeAt(i);
    embedding[i % 1536] += (charCode / 255.0 - 0.5) * 0.1;
  }

  // Normalize the embedding vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return { embedding };
}
