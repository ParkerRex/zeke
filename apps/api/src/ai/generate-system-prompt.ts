import { safeValue } from "@api/ai/utils/safe-value";
import { TZDate } from "@date-fns/tz";
import type { ChatUserContext } from "@zeke/cache/chat-cache";

/*
 * Zeke research ingest v0 (for Claude desktop smoke tests):
 * - Input: single arXiv PDF (e.g., Monolith realtime recsys paper in this folder) uploaded by the operator.
 * - Output vision: a cited, role-aware brief that mirrors the exec-overview promise—"10 hours → 5 minutes" and
 *   blends Bloomberg-grade rigor with Canva-level approachability.
 *
 * First experiments should enumerate the structured facts we care about before we add code:
 * 1. Metadata & provenance
 *    • Title, publication date/version, venue, DOI/arXiv ID.
 *    • Authors + affiliations (flag industry vs. academic, surface ByteDance/TikTok link for Monolith).
 *    • Funding, disclosures, released assets (code, data, appendix) with URLs.
 * 2. Why it matters
 *    • Problem statement in business language ("real-time recsys under concept drift").
 *    • Primary contributions/novelty bullets (collisionless embeddings, expirable features, incremental sync).
 *    • Quick contrast vs. prior art (hash-collision tables, batch-only training) and citation handles for cross-doc graphing.
 * 3. System + implementation snapshots
 *    • Pull architecture diagrams/tables, note required infra (Kafka, Flink, HDFS, PS clusters) and data contracts.
 *    • Extract any algorithms/parameters that translate to playbooks (eviction heuristics, sync cadence, sampling strategies).
 *    • Call out operational trade-offs (reliability vs. freshness, stale dense weights tolerance) with supporting quotes + page anchors.
 * 4. Evidence & quality signals
 *    • Metrics with context (AUC deltas, CTR lift, latency, footprint) + dataset scale; log odds correction notes for bias handling.
 *    • Limitations/open questions (failure modes, hardware assumptions, completeness of released code).
 *    • Trust levers: highlight where claims are backed by figures/equations and any caveats or missing receipts.
 * 5. ICP-aligned actions
 *    • Generate next steps per role (Product/GTM, Engineering/Data, Leadership) tied to goals or SOP templates.
 *    • Surface reusable assets (prompts, experiment briefs, PRD skeletons) that Zeke could auto-populate.
 *    • Map insights into our trend graph primitives: entities (authors, infra, benchmarks) + relationships for longitudinal tracking.
 *
 * Content schema we want to drive toward (proto-typed here so we can align LLM prompts + downstream TypeScript):
 *
 * interface ContentAnalysis {
 *   title: string;
 *   creators: Creator[]; // canonicalized list of authors/contributors with context + credibility notes
 *   contentType: 'paper' | 'podcast' | 'video' | 'blog' | 'thread' | 'newsletter' | 'course';
 *   highlights: string[]; // rapid-fire bullets (think "Bloomberg terminal" depth; cite source pages)
 *   calculatedConsumptionTime: string; // "25 min read" or "1h 45m listen"
 *   whyItMatters: string; // business-level framing tied to ICP pains (exec-overview style)
 *   sauce: string; // the one-liner you'd text a friend (keep it punchy, plain language)
 *   keyTakeaways: string[]; // 3–5 crisp statements with receipts (page anchors)
 *   prerequisites?: string[]; // optional—concepts/skills needed to grok the piece
 *   bestQuotes?: string[]; // memorable verbatim lines (keep citation metadata)
 *   actionableInsights?: string[]; // "What should I do right now?" suggestions mapped to SOPs
 *   relatedContent?: RelatedItem[]; // hooks into our trend/research graph
 * }
 *
 * interface Creator {
 *   name: string;
 *   role?: 'author' | 'host' | 'guest' | 'interviewer' | 'creator';
 *   context?: string; // e.g. "ByteDance researcher" (surface industry vs academic, highlight credibility levers)
 *   credibility?: string; // why we should listen (published SOTA? runs infra at scale?)
 * }
 *
 * interface RelatedItem {
 *   title: string;
 *   relationship: 'responds-to' | 'builds-on' | 'contradicts' | 'deep-dive' | 'summary-of';
 *   url?: string;
 * }
 *
 * Research-paper-specific mapping thoughts (grounded in tiktok-arxiv.pdf):
 * - contentType = 'paper'; creators array pulls author list + affiliations (ByteDance vs Fudan flagged in context).
 * - highlights/keyTakeaways draw from abstract + contribution bullets (collisionless embeddings, real-time sync, online joiner).
 * - calculatedConsumptionTime can leverage page count + reading speed heuristic (~2 min/page) until we have PDF analytics.
 * - whyItMatters should translate the technical novelty into ROI/ops language ("Real-time TikTok recsys reduces concept drift risk").
 * - sauce summarizes the punchline ("ByteDance built a recsys that updates itself every minute without blowing up reliability").
 * - actionableInsights should connect to Zeke playbooks: e.g., "Prototype eviction heuristics in our ingestion tower", "Tag Kafka/Flink patterns for SOP library".
 * - bestQuotes grab memorable lines (e.g., trade-off statements) for social snippets; ensure we store page numbers for receipts.
 * - relatedContent links to other recsys papers, BytePlus docs, internal podcasts; these relationships feed "trend graph" ambitions.
 *
 * Prompt scaffolding ideas:
 * - Stage 1 (LLM extraction): ask for JSON adhering to ContentAnalysis, enforce citations (`citations` array per bullet) once we move to structured outputs.
 * - Stage 2 (validation): run a lightweight verifier (TypeScript zod schema) ensuring arrays not empty, `contentType === 'paper'`, etc.
 * - Stage 3 (render): convert into Claude canvas sections (metadata block, Bloomberg-style fact table, Canva-friendly summaries).
 * - Future: upgrade to Vercel AI SDK 5.0 structured outputs to guarantee schema fidelity, then auto-orchestrate follow-up tool calls (e.g., fetch author LinkedIn, cross-reference with database types).
 *
 * Delivery notes:
 * - Cite every claim with page anchors/snippets so we uphold the "receipts" promise.
 * - Keep language approachable; pair dense details with one-line plain-English translations.
 * - Future state: enforce this schema with Vercel AI SDK 5.0 structured outputs, enabling deterministic downstream tooling.
 * - Once the schema feels right, we can wire dynamic tool calls + canvas UI around these sections inside the API.
 */

const generateBasePrompt = (userContext: ChatUserContext) => {
  // Format the current date and time in the user's timezone
  const userTimezone = userContext.timezone || "UTC";
  const tzDate = new TZDate(new Date(), userTimezone);
  const firstName = safeValue(userContext.fullName?.split(" ")[0]);

  return `You are a helpful AI assistant for Zeke, an AI-powered research platform.
    You help users with:
    - Research insights and analysis
    - Content management and discovery
    - Research briefings and reports
    - General research assistance

    IMPORTANT: You have access to tools that can retrieve real financial data from the user's account.

    TOOL USAGE GUIDELINES:
    - ALWAYS use tools proactively when users ask questions that can be answered with data
    - Tools have defaults - use them without parameters when appropriate
    - Don't ask for clarification if a tool can provide a reasonable default response
    - Prefer showing actual data over generic responses
    - Use web search tools when you need the most up-to-date information about tax regulations, laws, rates, or any topic that may have changed recently
    - When users ask about tax questions, deductions, compliance requirements, or recent tax law changes, search the web for the latest information before providing advice
    - Always verify current tax information, rates, and regulations through web search, especially for questions about deductions, filing requirements, or compliance

    TOOL SELECTION GUIDELINES:
    - Use data tools (getBurnRate, getRevenue, etc.) for simple requests: "What's my burn rate?", "How much do I spend?"
    - Use analysis tools (getBurnRateAnalysis, etc.) for complex analysis: "Analyze my burn rate", "Show me burn rate trends", "Generate a report"

    RESPONSE CONTINUATION RULES:
    - For simple data questions: Provide the data and stop (don't repeat or elaborate)
    - For complex analysis questions: Provide the data and continue with analysis/insights
    - Examples of when to STOP after data: "What's my burn rate?", "How much did I spend last month?"
    - Examples of when to CONTINUE after data: "Do I have enough money to buy a car?", "Should I invest?", "How is my business doing?"

    RESPONSE GUIDELINES:
    - Provide clear, direct answers to user questions
    - When using tools, present the data in a natural, flowing explanation
    - Focus on explaining what the data represents and means
    - Use headings for main sections but keep explanations conversational
    - Reference visual elements (charts, metrics) when they're available
    - Avoid generic introductory phrases like "Got it! Let's dive into..."
    - Present data-driven insights in a natural, readable format
    - Explain the meaning and significance of the data conversationally
    - When appropriate, use the user's first name (${firstName ? firstName : "there"}) to personalize responses naturally
    - Use the user's name sparingly and only when it adds value to the conversation
    - Maintain a warm, personal tone while staying professional and trustworthy
    - Show genuine interest in the user's financial well-being and business success
    - Use empathetic language when discussing financial challenges or concerns
    - Celebrate positive financial trends and achievements with the user
    - Be encouraging and supportive when providing recommendations

    MARKDOWN FORMATTING GUIDELINES:
    - When tools provide structured data (tables, lists, etc.), use appropriate markdown formatting

    Be helpful, professional, and conversational in your responses while maintaining a personal connection.
    Answer questions directly without unnecessary structure, but make the user feel heard and valued.

    Current date and time: ${tzDate.toISOString()}
    Team name: ${safeValue(userContext.teamName)}
    Company registered in: ${safeValue(userContext.countryCode)}
    Base currency: ${safeValue(userContext.baseCurrency)}
    User full name: ${safeValue(userContext.fullName)}
    User current city: ${safeValue(userContext.city)}
    User current country: ${safeValue(userContext.country)}
    User local timezone: ${userTimezone}`;
};

export const generateSystemPrompt = (
  userContext: ChatUserContext,
  forcedToolCall?: {
    toolName: string;
    toolParams: Record<string, any>;
  },
  webSearch?: boolean,
) => {
  let prompt = generateBasePrompt(userContext);

  // For forced tool calls, provide specific instructions
  if (forcedToolCall) {
    const hasParams = Object.keys(forcedToolCall.toolParams).length > 0;

    prompt += `\n\nINSTRUCTIONS:
   1. Call the ${forcedToolCall.toolName} tool ${hasParams ? `with these parameters: ${JSON.stringify(forcedToolCall.toolParams)}` : "using its default parameters"}
   2. Present the results naturally and conversationally
   3. Focus on explaining what the data represents and means
   4. Reference visual elements when available`;
  }

  // Force web search if requested
  if (webSearch) {
    prompt +=
      "\n\nIMPORTANT: The user has specifically requested web search for this query. You MUST use the web_search tool to find the most current and accurate information before providing your response. Do not provide generic answers - always search the web first when this flag is enabled.";
  }

  return prompt;
};
