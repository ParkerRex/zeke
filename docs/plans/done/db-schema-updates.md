Skip to content
You said:
im confused. when im building out software, i sometimes go do the front end stufff. i call that front end.
then i do the backend stuff on an express server, i call that backend

but now im gong back to do db migratoins bc i am missing stuff. is that called db planning?

but then i wanna know how the whole thing works togetehr is that systesm architecture?

context:
nextjs dev whos learnt backend using express, uses drizzly for db migrations on top of supabase
ChatGPT said:

Thought for 45s
Totally normal to feel this way—you're just touching different layers. Here’s a quick translation guide and a clean mental model you can reuse.

What to call things (practical glossary)
What you’re doing	Common term(s) to use	One-liner
Building UI in Next.js (pages/components, hooks, styling)	Frontend, UI, client	Everything the user sees & clicks.
Writing your Express APIs / routes / business logic	Backend, application layer, API	Code that enforces rules and serves data.
Designing tables, columns, relations, constraints	Data modeling, schema design (not “DB planning”)	Decide the truths your system stores.
Creating scripts to change the schema over time	Schema migrations (Drizzle migrations)	Versioned DDL changes you can apply/rollback.
Moving/transforming existing data	Data migration/backfill/ETL	Updating rows to fit the new schema.
Stepping back to see how FE, API, DB, queues, auth fit	System architecture / solution architecture	Boxes & arrows: components and how they talk.
How code is structured inside a service	Application architecture	Layers, modules, patterns within a codebase.
Hosting, deploys, CI/CD, secrets, monitoring	DevOps / platform / infrastructure	How it runs, scales, and is observed.
Minimal mental model (Next.js + Express + Drizzle + Supabase)
[Next.js (frontend)]
   ⟷ JSON/HTTP
[Express API (backend: routes, services)]
   ⟷ Drizzle ORM
[Postgres (Supabase)]  +  [Auth, Storage, Policies]
           ↑
     (Migrations: Drizzle)
A sane build flow for a feature
Data model first (schema design)

Entities, relations, constraints, indexes. Write it as an ERD or a quick table list.

API contract (backend surface)

Define request/response for each use case (a tiny OpenAPI snippet or just a typed interface).

Migrations (schema change management)

Drizzle migration for the new tables/columns + safe defaults. Add any backfill script if needed.

Backend logic

Implement route/handler/service; wire Drizzle queries; add input validation.

Frontend

UI states (idle/loading/error/empty/success); call the API; render results.

Ops

Run migration in staging, seed test data, observability checks, then prod.

Quick naming clarifications for you
What you called “DB planning” → say data modeling / schema design.

“Doing the missing stuff in DB now” → you’re creating schema migrations and maybe a data backfill.

“How it all works together” → system architecture (or system design).

Zero-downtime schema changes (mini-checklist)
Prefer additive changes first (add new column/table).

Backfill data.

Dual-read/write if you’re moving fields.

Flip reads to new shape.

Remove old column in a later migration.

Common pitfalls (and fixes)
UI works but API can’t support it → Write the API contract before UI.

Frequent rework in DB → Do a 15-minute schema sketch (entities, keys, constraints) before coding.

Slow queries → Plan indexes with your access patterns; add constraints early.

Migrations fail in prod → Test on staging with realistic data; include a rollback.

If you want, I can draft a tiny ERD + API contract template you can paste into your repo (and a 1-page “architecture.md” using the C4 model) tailored to your Next.js + Express + Drizzle + Supabase stack.

You said:
what is ddl?

ok. so if i wanna learn how bloomberg terminals db its setup and engine for processing stuff what would i be searching? eg. i wanna know how they name their fields and process them for all the news sources.. then i also wanna know how they built out their systems from a frameowrk/tech stack perspective. what would my prompt be to an AI?
ChatGPT said:

Thought for 1m 32s
Totally fair questions.

DDL = Data Definition Language — the SQL statements that define/alter database objects (e.g., CREATE TABLE, ALTER TABLE, DROP INDEX). It’s about the shape of your data, not the data itself.
Wikipedia
+1

If you want to study “how Bloomberg does it”
Bloomberg’s exact schemas are proprietary, but you can learn a lot from public docs and papers:

Field naming / dictionaries: Bloomberg uses field mnemonics (e.g., PX_LAST). You can look these up via the FLDS function on Terminal and in API docs (Field Information Service //blp/apiflds).
Eastern Michigan University
+1

News metadata standards to expect: Many major news providers model payloads with IPTC NewsML-G2 / ninjs, which gives you a solid mental model for story IDs, subjects, genres, timestamps, etc. (Not a Bloomberg-only thing, but industry standard.)
IPTC
+2
IPTC
+2

System/stack clues:

Bloomberg exposes data via BLPAPI/SAPI and Enterprise Access Point (hypermedia REST).
Bloomberg.com
+2
Bloomberg.com
+2

They’ve open-sourced Comdb2, their highly available distributed RDBMS (an existence proof of how seriously they take OLTP/storage).
bloomberg.github.io
+1

For news processing at scale, see Bloomberg’s NSTM paper (query-driven clustering/summarization, sub-second latency).
arXiv

Bloomberg also publicly talks about AI summaries for Terminal news.
WatersTechnology.com
+1

Search strings that work
Use these verbatim in a web search:

site:bloomberg.com/professional "API" "Developer Guide" BLPAPI

FLDS field mnemonics PX_LAST site:bloomberg.com filetype:pdf

"//blp/apiflds" BLPAPI

site:data.bloomberg.com "Hypermedia REST" "Enterprise Access Point"

NewsML-G2 fields subject headline guid site:iptc.org

Bloomberg Comdb2 paper pdf

Bloomberg news summarization NSTM arxiv

Prompts you can paste into an AI
1) Field naming & dictionary (market/news)
You are a research assistant. Use only official/public sources.
Task: Build a field dictionary for Bloomberg-style data with two parts:
(A) Market-data fields (mnemonics like PX_LAST) and their meanings.
(B) News-related metadata fields commonly used by major wires (per IPTC NewsML-G2 / ninjs) that Bloomberg is likely to interoperate with.

Method:
1) From Bloomberg API docs, identify how to discover field mnemonics (FLDS function; Field Information Service //blp/apiflds). Capture examples and categories (price, reference, fundamentals).
2) From IPTC NewsML-G2 and ninjs docs, list canonical news item properties (id/guid, headline, body, byline, provider, subject/tags, language, timestamps, geos, entities).
3) Produce a CSV with columns: source (Bloomberg|IPTC), field_name, description, data_type, example_value, notes.
4) Clearly label what’s Bloomberg-specific vs. industry-standard.

Citations: Link every non-obvious claim to an official PDF or primary page.
Deliverables: the CSV and a 1-page summary of naming conventions (mnemonic style vs. snake_case).
(Why this works: FLDS & //blp/apiflds are documented; NewsML-G2/ninjs define widely used news fields.)
IPTC
+3
Bloomberg Data
+3
Eastern Michigan University
+3

2) News ingestion & processing pipeline
You are a systems analyst. Map a high-throughput news pipeline (Bloomberg-like) using only public sources and standard patterns.

Scope:
- Ingestion from multiple wires/sites.
- Normalization to an IPTC-compliant model.
- Deduplication, clustering, and summarization (see Bloomberg NSTM).
- Entity linking to companies/tickers and industry taxonomy (mention BICS as a reference taxonomy).
- Storage, indexing, and retrieval for sub-second search.

Steps:
1) Outline components: fetchers, canonicalizer (NewsML-G2/ninjs), deduper (hash + near-dup), clusterer (semantic), summarizer (extractive/abstractive), entity linker, enrichment (tickers, geos), indexer, cache.
2) Specify event contracts between stages (fields, types, error codes).
3) Recommend storage/index choices and partitioning keys for time-ordered news.
4) Produce a C4 container diagram and a sequence diagram for “new article → user view”.
5) Call out which parts are public fact (cite) vs. informed inference.

Cite:
- IPTC standards for schema,
- Bloomberg NSTM paper for clustering/summarization approach,
- BICS note for taxonomy context.
BBHub Assets
+3
IPTC
+3
IPTC
+3

3) “How did they build it?” (stack & interfaces)
Act as a tech historian. Using official sources, summarize Bloomberg’s public-facing data interfaces and infrastructure signals:
- BLPAPI/Server API (SAPI) capabilities and event model.
- Enterprise Access Point (hypermedia REST) for licensed datasets.
- Comdb2 (open-source) as an example of in-house RDBMS design priorities.

Deliver:
- A 1-page explainer of each interface (what it exposes, latency/throughput expectations, auth model).
- A comparison table: BLPAPI vs SAPI vs Enterprise Access Point (protocols, use cases).
- A short note on why an HA relational core (e.g., Comdb2) matters for financial workloads.

Cite primary docs/pages for each bullet.
VLDB
+4
Bloomberg.com
+4
Bloomberg.com
+4

4) Map it to your stack (Next.js + Express + Drizzle + Supabase)
Translate Bloomberg-like patterns to a modern indie stack:

Goal: Propose a minimal architecture for an AI news terminal:
- Next.js app (UI + server actions for authenticated reads).
- Express engine(s) for ingestion and processing.
- Supabase Postgres for storage + Drizzle migrations.
- Vector store (pgvector) for semantic clustering/search.
- Job queue (pg-boss) for pipeline steps.

Deliverables:
1) A schema (DDL) for sources, articles, entities, article_entities, clusters, summaries; include indexes and FTS/pgvector hooks.
2) A migration plan (additive → backfill → cutover).
3) A sequence diagram from “source fetch” to “user reads cluster.”
4) Hardening checklist: rate limits, retries, observability, rollbacks.

Keep to copy-paste-able SQL/TypeScript and explain trade-offs briefly.
If you want, I can turn #4 into concrete Drizzle migrations + a minimal ERD for your Supabase instance next.

You said:
take a look at my current engine in the github repo attched. we're trying to figure out what we need to do to make the engine strong such that it can deliver on the promise outlined in docs/exec-overview.md.
ChatGPT said:
Could you clarify what specific aspects of the engine you're most concerned about strengthening? For example, are you looking to improve performance, accuracy of outputs, fault tolerance, scalability, or integration with external systems?

Also, when you mention "the engine"—do you mean a specific file or module that handles ingestion, task processing, or something else? Let me know so I can analyze the right part of the codebase.

You said:
Bloomberg Terminal’s Early History & Lessons for Zeke’s Strategy.pdf
PDF
right now it doesnt work so were refactoring it, hence the research on bloomberg. I attached a pdf that outlines the similarities between what bloombergs doing and what were trying to do at my startup zeke (were 17 days into development)

we want to get 100 news sources to start, and i was trying to figure out the schema design. we want up to 9,999 youtube videos per day since thats the api limit. we dont want to store or run yt-dlp on the videos.

the ideas that we do written, video, and audio form of content at hte top of the pipeline, then we grade it, pull insights etc and serve them to customers
ChatGPT said:
Got it. I’ll review your current engine implementation and identify what needs to be refactored or built to meet the strategic goals outlined in docs/exec-overview.md and the attached Bloomberg comparison PDF.

I’ll look at:

What the current engine is doing and where it breaks down

How it needs to scale to support 100+ sources and 9,999 YouTube videos/day

Schema and engine improvements to support ingest → grade → insight → serve across modalities

Comparisons to Bloomberg’s early architecture for inspiration

I’ll report back with a roadmap for strengthening the ingestion engine and schema design to deliver on Zeke’s core promise.

Research completed in 9m · 21 sources · 15 searches
Refactoring Engine to Deliver Zeke’s Ingestion and Analysis Engine

Strengthening Zeke’s Engine to Fulfill its Vision
Zeke’s goal is to “turn sprawling content into verified insights and ready-to-use outputs, fast”
GitHub
 – essentially an “AI-era Bloomberg Terminal” for research and content intelligence. Achieving this requires a strong content engine that can ingest diverse sources at scale, analyze and unify that information, and produce credible, actionable insights. Below we outline the current architecture and the key enhancements needed for Zeke’s engine to deliver on the promise in the exec overview.
Current Architecture: Modular Engine & Pipeline Foundation
Zeke’s backend is structured as a modular engine service with a job queue (pg-boss) orchestrating ingestion and analysis tasks
GitHub
. This decoupled design is a solid foundation – it replaces a previous monolith with clearer modules for different stages (ingestion, extraction, analysis)
GitHub
. The engine defines distinct job queues and workers for system heartbeats, source ingestion (RSS vs YouTube), content extraction, and LLM analysis
GitHub
GitHub
. These run on a schedule (e.g. RSS every 5 min, YouTube every 15 min) and on startup to continuously pull new content
GitHub
GitHub
. RSS ingestion is fully implemented. For each RSS feed source, the engine fetches the feed, parses items, and upserts new entries (avoiding duplicates via a unique (source_id, external_id) index)
GitHub
GitHub
. New items trigger a content-fetch job to scrape the article text using Mozilla Readability, store it in the contents table, and create a story record
GitHub
GitHub
. If the same content was already seen (e.g. syndicated article), Zeke detects it by hashing text and reusing the existing story instead of duplicating
GitHub
GitHub
. Finally, an LLM analysis job is queued for each new story
GitHub
GitHub
. This pipeline (ingest → extract → analyze) for text sources is operational. It establishes end-to-end flow from raw content to an analyzed story, with pg-boss ensuring reliability (jobs can be retried or failed gracefully) and the engine handling shutdown signals and health checks for stability
GitHub
GitHub
. In short, Zeke’s current engine can handle web articles end-to-end. YouTube ingestion is partially integrated: the schema and job definitions exist to support YouTube channels and search queries as sources
GitHub
GitHub
. The engine will use the YouTube Data API (with a daily quota of ~10k units) to fetch recent videos for each channel or query source
GitHub
GitHub
. It upserts new videos into raw_items and queues a fetch-youtube-content job for each
GitHub
. However, the heavy lifting – downloading/transcribing video content – is currently disabled unless the environment has a YouTube API key and the necessary ML dependencies
GitHub
GitHub
. This was intentional: to deploy quickly, the team deferred the large Python/Whisper stack needed for video processing
GitHub
. The engine checks YOUTUBE_API_KEY and skips YouTube jobs if not configured, so the current deployment only handles RSS/text feeds
GitHub
. In summary, the existing engine is modular and cloud-ready, with an efficient queue-based design. It can ingest and analyze text sources reliably, and it has stubs in place for video and audio content. This modular architecture aligns well with Zeke’s needs – as Bloomberg did for finance, Zeke is building a system to combine previously disparate functions into one interface (aggregating news, videos, podcasts, etc., plus analytics).
Scaling Ingestion for 100+ Sources and Thousands of Videos
To make the engine “strong,” it must robustly handle the target volume: e.g. ~100 news sources and up to ~9,999 YouTube videos per day. This will require scaling strategies in both software and infrastructure:
Concurrency & Throughput: The current job handlers process sources sequentially in a loop
GitHub
GitHub
. With ~100 feeds, sequential fetches could take minutes (risking overlap with the next run). We should introduce controlled concurrency – e.g. spawn multiple feed fetches in parallel (with a limit to avoid overload) or queue each source as its own job in ingest:source. The design already has an INGEST_SOURCE queue defined
GitHub
; leveraging it (i.e. have processIngestPullJob enqueue individual source jobs instead of doing all in one task) would distribute load and let pg-boss manage parallelism. Similarly for YouTube: currently each channel is fetched in sequence
GitHub
. Running a few in parallel (batch size tuning) can speed up throughput. The engine can safely increase concurrency given the modular tasks – e.g. allow multiple extract-content jobs to run in parallel, since each operates on independent items. The job definitions already use small batch sizes (e.g. fetch-content batch of 5)
GitHub
 to group tasks without overwhelming memory. With careful tuning and perhaps multiple engine processes, the engine can handle large volumes without bottlenecking on one-by-one processing.
Resource Isolation for Heavy Tasks: Videos and podcasts require downloading media and running transcription (Whisper or similar), which is CPU/GPU intensive and makes Docker images huge. The team’s two-phase deployment strategy is wise: keep the core RSS engine lightweight for fast deploy, and handle YouTube/podcast processing in a specialized service or environment
GitHub
GitHub
. To deliver on the promise of ingesting video/audio content, we’ll need to implement Phase 2:
Either deploy a separate “YouTube Engine” service with the full ML stack (yt-dlp, FFmpeg, Whisper/PyTorch)
GitHub
GitHub
, or migrate the engine to a platform like GCP Cloud Run that supports larger images and more memory/CPU
GitHub
. The separate service approach (microservice) has the advantage of independent scaling – e.g. it could run on a GPU-enabled instance or scale out pods to transcribe videos in parallel
GitHub
. The core pg-boss queue can still be shared: the heavy engine would specialize in ingest:fetch-youtube-content jobs while the main engine handles lighter jobs. This way, the system can transcribe videos without slowing down article ingestion.
Implement rate limiting and batching for the YouTube API usage. The code already tracks API quota usage and stops when nearing the daily limit
GitHub
GitHub
. We should ensure the quotaTracker prevents overshooting the 10k units/day by perhaps spreading calls evenly throughout the day and using the YOUTUBE_RATE_LIMIT_BUFFER (set to 500) as a safety margin
GitHub
. In practice, 9,999 videos/day is an upper bound – actual usage might be lower – but the engine should be prepared to handle bursts (for example, if a trending topic causes many videos at once). Batching API calls (the code already fetches up to 10 videos per channel per run by default
GitHub
GitHub
) and adjusting the schedule frequency can help maximize coverage within quota.
Asynchronous transcription: For scaling, consider making the transcription step asynchronous or parallel. For example, the engine could offload audio files to a cloud transcription API (like OpenAI Whisper API or AssemblyAI) and poll for results, rather than processing entirely synchronously. Using OpenAI’s Whisper API would eliminate the need to bundle PyTorch, at the cost of API fees – a trade-off to evaluate. If local Whisper is used, leveraging concurrency (multiple processes or threads) or GPU acceleration is key. The chosen Cloud Run/VM approach should allow using all available CPU cores or a GPU for Whisper to speed up transcribing long videos.
Robust error handling & retries: A strong engine should be resilient to transient failures (network timeouts, API errors). The current design logs errors and marks job failures
GitHub
GitHub
, but we should also configure automatic retries for certain jobs. Pg-boss supports retry strategies; for instance, a failed content extraction due to a temporary network issue could be retried a couple of times before giving up. We can define retry limits/backoff in boss.send or boss.createQueue (e.g., allow 3 retries with exponential backoff for network-dependent tasks). This will reduce manual intervention. Additionally, implementing alerts or monitoring for repeated failures (e.g., if a source consistently fails ingestion due to a bad URL or parse error) will help maintain engine health – possibly marking such sources as inactive or flagging them for review via upsertSourceHealth (which currently records status in the DB)
GitHub
GitHub
.
By addressing concurrency, heavy task isolation, and resiliency, Zeke’s engine will reliably handle the influx of content. This is akin to how Bloomberg scaled from a few data feeds to thousands – investing in infrastructure early so it could ingest all relevant information in real-time. Zeke’s platform must be able to ingest anything (text, video, audio) and do it continuously
GitHub
, which these improvements will enable.
Unified Content: Deduplication and Source Integration
One of Zeke’s promises is that it “sifts across sources you’d only reach if you had a full-time researcher”
GitHub
 and finds what matters. To truly deliver this, the engine should not only ingest many sources, but also link related content across those sources. In practice, that means implementing smart deduplication and clustering so that the user sees a unified story rather than fragmented duplicates. The groundwork is partially there: the schema has stories and clusters tables to group content
GitHub
GitHub
. Currently, an exact content hash match causes reuse of the same story (preventing exact duplicates of an article)
GitHub
. We need to extend this to catch fuzzy duplicates – e.g. a podcast episode that is also on YouTube, or multiple news articles covering the same event. Cross-source deduplication: As outlined in the planning docs, Zeke can implement an intelligent content matching system. For example, a planned algorithm for podcasts would attempt to match an Apple Podcast episode to an existing YouTube video by comparing titles, durations, and metadata
GitHub
GitHub
. We should integrate a content matcher step in the ingestion pipeline: when a new piece of content is extracted, before creating a new story, check if it likely corresponds to an existing story. This may involve:
Title similarity matching (normalized titles, perhaps using fuzzy string matching or even embedding similarity on titles)
GitHub
GitHub
.
Metadata checks: for videos/podcasts, compare publication dates, episode numbers or known cross-post links (the metadata JSON for sources can include known YouTube channel IDs for a podcast, etc. as in the Lex Fridman example)
GitHub
GitHub
.
If a match is found (above a confidence threshold), the engine can link the new raw item to the existing story instead of inserting a separate story. This could mean simply adding another entry in a story_sources mapping (not currently in schema, but clusters could serve similar purpose). Or we mark the story’s primary_url as one source and perhaps store alternates in story.metadata.
The benefit is twofold: (1) Save processing – we don’t transcribe the same content twice (e.g., skip Whisper if we know a YouTube video’s transcript is already obtained via the podcast audio or vice-versa). (2) Improve quality – choose the best version of content. The plan notes “serve video players with podcast-quality transcripts”
GitHub
. For example, if the audio-only podcast is higher fidelity than the YouTube auto captions, we prefer to transcribe the podcast and attach that transcript to the YouTube story. Our engine could implement this by, say, when a duplicate match is found, storing the transcript in a common way and pointing both raw items to the same content. The contents table already has fields for audio_url, transcript_url, etc., which we can reuse. Ensuring one canonical content per story will make later analysis more accurate (no fragmented insight for essentially the same talk). Clustering related stories: Beyond exact duplicates, Zeke should group content on the same topic. This is similar to how news aggregators cluster articles about the same event. The cluster_key in the schema suggests using a shared key to identify stories that belong together
GitHub
. We could generate a cluster key by a hashing of significant keywords or using the embedding vectors: e.g., if a new story’s embedding is very close to an existing story’s embedding, assign them the same cluster. The engine might run a periodic job (or on each new story creation) to compare the new story embedding against recent ones and decide if they cluster (perhaps using cosine similarity threshold on the story_embeddings vector)
GitHub
. Clustering ensures that if, say, 5 sources all report on the same breakthrough, Zeke can identify that and perhaps only surface one “story” with combined insights. Bloomberg did something analogous by adding their own news service and linking data points, giving users one place to see all related info. Zeke’s engine can likewise provide a “single source of truth” per story, with all supporting content attached. In practical terms, implementing this might require:
A background cluster maintenance job that updates clusters and picks a representative story (could be the first or the one with highest “authority_score” source)
GitHub
.
Merging the why_it_matters analysis if multiple stories are clustered – perhaps future analysis can take into account all sources in a cluster for a more comprehensive summary.
By unifying duplicate or related content, the engine delivers a cleaner experience (“turning chaos into playbooks”). Users won’t see the same interview twice or have to manually connect an article to a YouTube talk about the same subject – the engine does that for them. This is crucial for Zeke’s value prop of saving time and finding the signal in the noise
GitHub
.
Enhanced Analysis & Insight Extraction
In the exec overview, Zeke promises not just summaries, but deeper insights: “claims, numbers, demos, contradictions, trends” highlighted, “heat” signals, novelty detectors, role-specific takeaways, and more
GitHub
GitHub
. Achieving this will require upgrading the LLM analysis step and possibly adding new analytic micro-services. Current analysis: Right now, once a story’s content is extracted, Zeke uses an OpenAI GPT-4 (or 3.5) call to generate a JSON with why_it_matters (2-3 bullet summary of significance), a chili score (0-5 hotness), and a confidence score
GitHub
GitHub
. This is a great start: every story gets a short explanation of why it’s important, and a rough importance rating. The analysis is then stored in story_overlays (with model version)
GitHub
, and a vector embedding of the content is stored for similarity search
GitHub
GitHub
. This means the engine already provides verified insight in the form of a why-it-matters brief, and it can support search/discovery via embeddings. To fully deliver on Zeke’s vision, we should extend the analysis in several ways:
Content-type specific prompts: The analysis should be aware of whether the story is a video, podcast, research paper, etc., and adjust accordingly. Currently, the prompt assumes a “news article”
GitHub
 – we should generalize that. For example:
For YouTube videos (especially long interviews or demos), we might prompt the LLM to output not just why it matters, but also a “chapter map” of key moments with timestamps and titles
GitHub
. If the video has chapters in its description, we can incorporate those titles; otherwise, we could have the LLM identify major segments (perhaps by splitting the transcript by topic changes). We can feed the model the transcript (or a truncated version plus selected segments) and ask for an outline of the content with timestamps. We can also generate a “what’s new” section: instruct the model to flag any claims or demos in the video that seem novel or significant relative to common knowledge. This might require providing context (which is hard to do broadly), but even highlighting statements that are emphasized by the speaker or elicit strong audience reaction could be a proxy. Additionally, we can calculate “heat signals” (performance metrics) outside the LLM: e.g., compare the video’s view count in the first 24 hours to the channel’s average – if our data shows it’s 3x higher, that’s a strong signal. This would require storing channel baseline metrics (we might gather each channel’s typical view count from past videos via the YouTube API or metadata). The engine can then feed that info into the analysis or store it as part of story_overlays (e.g., a field for “heat_rank” or just incorporate into the chili score). Comment analysis is another feature: using the YouTube API, we can fetch top comments and have the LLM summarize themes or sentiment (e.g. “Audiences are excited about X, but skeptical about Y”). This might be done on-demand (when a user views the story) to save processing, or for top-priority videos we do it offline. Either way, the engine design should accommodate an additional analysis stage for comments – perhaps a separate job that runs after transcription to gather comments and then appends a “comment_summary” to the story metadata.
For podcasts, the analysis could emphasize speaker differentiation and actionable takeaways. Since transcripts may not have speaker labels, one approach is to have the LLM infer speakers by changes in speaking style or context (or use metadata if we know the hosts/guests). The desired output per the overview: an outline noting who said what (“Alice argues X, Bob counters Y”)
GitHub
, an evidence ledger (claims with flags on uncertainty)
GitHub
, and role-aware takeaways (“If you’re a PM, focus on Y”)
GitHub
. To do this, we might feed the model with segments of the transcript and explicitly ask it to identify distinct voices and their key points. We can also prompt it to list any claims made (especially bold claims or stats) along with whether they seem well-supported or questionable (the model can flag those with low confidence as in “uncertain”). This would fulfill the “no black-box” ethos by making the AI call out when it’s unsure
GitHub
. The “role-aware” part likely requires knowing user roles – which we discuss below (applying to user goals) – but the engine can prepare general takeaways for a few archetypal roles (e.g. “For engineers, the key insight is…, for marketers, it is…”). These could be generated and stored so the frontend can filter or display them as needed.
For research papers, analysis should dig into technical novelty, compare to prior work, and check for things like code availability
GitHub
GitHub
. We might integrate external data: e.g., use the arXiv API or PapersWithCode to see if code or results exist, or simply prompt the model to extract any mention of “we achieve state-of-the-art” or “we provide code at…”. The engine could run a small custom script to pull references or citation counts for the paper to gauge impact, and feed that into the LLM prompt (“The paper has X citations and code available/not available”). The output can fill fields like novelty (what’s new and how it compares to SOTA), replicability (did they release code or data?), and application decision (“Should we try this?” with effort vs reward)
GitHub
GitHub
. Some of this might be handled by prompting GPT-4 with the full paper text (or a summary of it) and asking specific questions. Given the length of papers, the engine might first use an extraction script (e.g., parse PDF to text and find sections like results, method, etc.). Storing the full text may be heavy; instead, we can store key excerpts or use embedding to link to related work.
In essence, the engine’s analysis component should evolve from a single generic summary to a richer, multi-faceted analysis pipeline. We can implement this by adding new job types or analysis stages. For example:
After the initial analyze:llm (which gives us why-it-matters and chili), we could queue a analyze:details job that triggers content-specific routines. Alternatively, we can incorporate some of these in one prompt if the model can handle it (but that may be too much at once). A modular approach might be safer: e.g., a analyze:comments job if comments are to be processed, a analyze:segments job for splitting into chapters, etc., each populating fields in the database (perhaps new tables or JSON in story_overlays.citations or a story_details table).
Some analyses might not require LLM: e.g., computing “day-1 vs median views” is a simple calculation once data is stored; we just need to store the result.
Importantly, any insights we add should preserve verification (“receipts”). Bloomberg’s success was partly due to providing hard data alongside analysis (e.g., analytics with source data at a keystroke). Zeke similarly must ensure the AI’s outputs are traceable to the original content. The current system plans to store citations (source snippets) for each story – the citations field in story_overlays is intended for that
GitHub
. We should implement the logic to fill citations. One approach: after generating why_it_matters bullets, for each bullet ask the model (or use a simple text search) to find a sentence or phrase in the original content that supports it. Since we have the full text/transcript, we could do a keyword search or use embeddings to locate the closest sentence to the bullet’s theme. Then save those as citations (e.g., as a JSON of bullet -> quote mappings, or timestamp for video). This addresses the user objection “AI makes things up” with a strong answer: every claim is anchored to a snippet or timestamp you can check yourself
GitHub
. This is a differentiator that Zeke highlights (“with receipts, no AI slop”), so the engine must systematically produce those receipts. Finally, by enriching the analysis, we make the engine deliver not just a summary, but a mini “playbook” for each piece of content. For example, after processing a YouTube demo, the stored outputs might include: a summary of why it matters, a list of key demo moments (with timestamps), a novelty assessment, a heat score, and even a draft “action plan” suggestion (if we integrate the apply step). This transforms raw content into actionable insight, which is exactly Zeke’s value prop
GitHub
. It’s akin to how Bloomberg would not just give raw stock data, but also analytics, news, and alerts in one place – making it invaluable. Here, by adding these layers of analysis, Zeke’s engine will produce invaluable synthesized knowledge from raw info.
Applying Insights to User Goals (From Insight to Output)
The last mile of Zeke’s promise is turning insights into outputs tailored to the user – “prompts, briefs, plans, content… grounded by receipts”
GitHub
. In other words, after analysis, the engine should help the user apply the knowledge to their context and create something new (be it a strategy memo, a marketing email, or a product idea). This goes beyond what Bloomberg Terminal did (Bloomberg provided data and analytics, but not auto-generated plans), so it’s a key innovation for Zeke. To support this, the engine needs to incorporate user-provided context and templates into the generation process:
Zeke allows users to “load your goals and SOPs (or use ours)”
GitHub
. We should design a way to store this information securely (likely in a user-specific table). Perhaps a table for “user_strategies” or “company_SOPs” where a user can save guidelines, priorities, or even brand voice preferences. The engine (or more likely, the app layer calling the engine) can retrieve this context when needed.
One approach is to have pre-defined output formats (templates) for common needs – e.g., “Technical brief”, “Executive summary email”, “Twitter thread”. The exec overview mentions one-click outputs like product brief, campaign angle, experiment plan for a given insight
GitHub
GitHub
. We can implement each of these as a prompt template that the LLM fills using the story’s insights + the user’s context. For instance, a “Product brief” prompt might say: “You are writing a brief for the product team about this development. The team’s goal is X (from user’s goals). Using the insights from this story, draft a brief that covers impact, risks, and next steps, citing any facts.” The engine would plug in: the story’s analyzed content (why it matters, key facts), plus any relevant user goal (e.g. “goal: improve user retention”), and then generate the brief with citations.
Architecturally, these output generations could be on-demand calls to the LLM via an API endpoint (since they’re user-triggered). We might not precompute every possible output for every story – that would be overkill (imagine generating a PM brief, marketing email, and thread for each of thousands of stories when many may never be used). Instead, lazy-generate them: when a user clicks “Draft a LinkedIn post about this”, the app back-end calls a function that pulls the story’s analysis from the DB, the user’s context, and a template prompt to OpenAI, then returns the result (and possibly saves it if we want to keep it).
The engine should ensure that this generation is also “grounded by receipts.” That means the output should include citations (e.g., footnotes or inline references to the source material). We can enforce this by instructing the LLM to include quotes or reference the content. Our earlier step of storing citations for key points will help – the output generator can easily grab a few choice snippets that the analysis identified and compel the LLM to use those in the final text (perhaps even provide them as part of the prompt context). This aligns with the motto “no AI slop” – everything claimed in the output can be backed up by the original source.
By integrating user goals into the pipeline, Zeke’s engine truly becomes the “missing layer that connects research to outcomes”
GitHub
. Instead of just dropping a summary on the user, it closes the loop and produces a result that the user can directly use (publish a blog, execute a strategy, etc.). This is a major value-add: for example, “from 10 hours of research to a 5-minute brief” – and then that brief can immediately be turned into an email or plan with one click. To implement this safely, we might want to sandbox or review outputs when needed – but given this is an AI research assistant, users likely expect and accept AI-generated drafts. From a development standpoint, this part might live in the app layer (Next.js API routes calling the OpenAI API, for instance) rather than the engine, since it’s interactive. However, the engine could handle some batch outputs for very common things (maybe a daily trend report email?). It’s worth considering a cron job that creates an “AI news brief” each morning aggregating top stories for certain categories – effectively a meta-output combining multiple stories. This would be analogous to Bloomberg’s daily news briefs but powered by our engine. With the clustering and chili scores, we can pick the top “hot” stories and have the LLM create a summary-of-summaries newsletter, with citations. This could be stored or sent to users, demonstrating the engine’s power. In summary, to fully realize the exec overview’s vision, the engine must not stop at analysis – it must facilitate creation. By handling user context and output generation, Zeke moves from being just a research tool to a productivity tool that delivers finished outputs. This capability will set it apart from generic summarizers, much like Bloomberg set itself apart by letting traders not only see data but act on it within the same terminal (messaging, trading, etc., all in one place).
Conclusion
To deliver on Zeke’s ambitious promise, the content engine must evolve on multiple fronts. It needs to ingest a broad array of sources at scale – from dozens of RSS feeds to thousands of videos – in a scalable, modular way (using multiple workers or services as needed)
GitHub
GitHub
. It must continuously integrate and deduplicate content, so users get a unified “story” with all relevant information, instead of noise and repeats
GitHub
GitHub
. The analysis layer should become more powerful and nuanced, extracting the precise insights, metrics, and even contradictions that a human researcher would, all while providing the evidence behind each claim
GitHub
GitHub
. And finally, the engine should bridge the gap from insight to action by incorporating user context and producing outputs that users can directly employ
GitHub
GitHub
. These enhancements echo the lessons from Bloomberg’s early success. Integration of functions is key – Bloomberg combined data, news, analytics, and communication in one platform, and Zeke aims to unite multi-format content, AI analysis, and content creation in one flow. Constant improvement and expansion of content made Bloomberg indispensable; for Zeke, continually adding new sources (blogs, Twitter, internal documents, etc.) and new analysis features (sentiment, trend detection, etc.) will similarly increase its value. Critically, differentiating on user experience and trust fueled Bloomberg’s adoption (e.g. the specialized keyboard and reliable data). For Zeke, an analogous focus means a slick UI where everything is cited and at your fingertips – e.g. you can jump from a bullet point to the exact video timestamp in one click
GitHub
 – and a feeling that this engine is like having a team of researchers plus a strategist in one. By implementing the above improvements, Zeke’s engine will be equipped to deliver on its promise: turning the deluge of content into actionable, verified insight, and doing so at a scale and speed that gives each user a “pro-level” research capability
GitHub
. In short, it transforms chaos into clarity – fulfilling the vision of making research effortless and effective, much as Bloomberg Terminal became the effortless window into the financial world. With a strong engine foundation and these enhancements, Zeke can truly become the must-have “intelligence platform” described in its strategy, bridging information to outcomes for its users. Sources:
Zeke Repository – Engine architecture and job pipeline
GitHub
GitHub
GitHub
GitHub
Zeke Exec Overview – Product vision and promises
GitHub
GitHub
GitHub
Zeke Planning Docs – YouTube strategy and podcast spec (content deduplication)
GitHub
GitHub
GitHub
Bloomberg Terminal Early History & Lessons for Zeke – Integration and UX lessons

Sources
You said:
What would the data schema design look like for this? In our schema below, what would we change so that it's a lot easier to read?


/**
 * Revised Drizzle Schema for Zeke
 * Based on docs/plans/in-progress/db-proposed-er.md
 *
 * This schema implements the Discover → Apply content intelligence pipeline
 * with multi-tenant support, story intelligence, highlights, playbooks, and assistant features.
 */

import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	foreignKey,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	pgView,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

// ============================================================================
// ENUMS
// ============================================================================

export const healthStatus = pgEnum("health_status", ["ok", "warn", "error"]);
export const pricingPlanInterval = pgEnum("pricing_plan_interval", [
	"day",
	"week",
	"month",
	"year",
]);
export const pricingType = pgEnum("pricing_type", ["one_time", "recurring"]);
export const subscriptionStatus = pgEnum("subscription_status", [
	"trialing",
	"active",
	"canceled",
	"incomplete",
	"incomplete_expired",
	"past_due",
	"unpaid",
	"paused",
]);
export const planCodeEnum = pgEnum("plan_code", [
	"trial",
	"starter",
	"pro",
	"enterprise",
]);
export const teamRole = pgEnum("team_role", [
	"owner",
	"admin",
	"member",
	"viewer",
]);
export const inviteStatus = pgEnum("invite_status", [
	"pending",
	"accepted",
	"expired",
	"revoked",
]);
export const storyKind = pgEnum("story_kind", [
	"article",
	"video",
	"podcast",
	"pdf",
	"tweet",
]);
export const highlightKind = pgEnum("highlight_kind", [
	"insight",
	"quote",
	"action",
	"question",
]);
export const playbookStatus = pgEnum("playbook_status", [
	"draft",
	"active",
	"published",
	"archived",
]);
export const stepStatus = pgEnum("step_status", [
	"pending",
	"in_progress",
	"completed",
	"skipped",
]);
export const threadStatus = pgEnum("thread_status", [
	"active",
	"resolved",
	"archived",
]);
export const messageRole = pgEnum("message_role", [
	"user",
	"assistant",
	"system",
]);

export const activityTypeEnum = pgEnum("activity_type", [
	"story_published",
	"story_pinned",
	"highlight_created",
	"highlight_pinned",
	"playbook_created",
	"playbook_published",
	"assistant_thread_started",
	"assistant_message_posted",
	"goal_created",
	"goal_completed",
	"subscription_upgraded",
	"subscription_downgraded",
]);

export const activityVisibilityEnum = pgEnum("activity_visibility", [
	"team",
	"personal",
	"system",
]);

// ============================================================================
// USER & PROFILE TABLES
// ============================================================================

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().notNull(),
		email: text("email").notNull(),
		fullName: text("full_name"),
		avatarUrl: text("avatar_url"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("users_email_key").using("btree", table.email),
		index("users_created_at_idx").using("btree", table.createdAt),
	],
);

export const userProfiles = pgTable("user_profiles", {
	userId: uuid("user_id")
		.primaryKey()
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	jobTitle: text("job_title"),
	preferences: jsonb("preferences"),
	timezone: text("timezone").default("UTC"),
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
	updatedAt: timestamp("updated_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

// ============================================================================
// TEAM & MEMBERSHIP TABLES
// ============================================================================

export const teams = pgTable(
	"teams",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		ownerId: uuid("owner_id").references(() => users.id),
		stripeCustomerId: text("stripe_customer_id"),
		planCode: planCodeEnum("plan_code").default("trial"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("teams_slug_key").using("btree", table.slug),
		uniqueIndex("teams_stripe_customer_id_key").using(
			"btree",
			table.stripeCustomerId,
		),
		index("teams_owner_id_idx").using("btree", table.ownerId),
	],
);

export const teamMembers = pgTable(
	"team_members",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: teamRole("role").notNull().default("member"),
		status: text("status").notNull().default("active"),
		joinedAt: timestamp("joined_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("team_members_team_user_key").using(
			"btree",
			table.teamId,
			table.userId,
		),
		index("team_members_user_id_idx").using("btree", table.userId),
	],
);

export const teamInvites = pgTable(
	"team_invites",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		invitedBy: uuid("invited_by").references(() => users.id, {
			onDelete: "set null",
		}),
		email: text("email").notNull(),
		role: teamRole("role").notNull().default("member"),
		status: inviteStatus("status").notNull().default("pending"),
		expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("team_invites_team_email_idx").using(
			"btree",
			table.teamId,
			table.email,
		),
		index("team_invites_status_idx").using("btree", table.status),
	],
);

// ============================================================================
// CUSTOMER & GOAL TABLES
// ============================================================================

export const customers = pgTable(
	"customers",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		persona: text("persona"),
		status: text("status").default("active"),
		ownerId: uuid("owner_id").references(() => users.id, {
			onDelete: "set null",
		}),
		context: jsonb("context"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("customers_team_id_idx").using("btree", table.teamId),
		index("customers_owner_id_idx").using("btree", table.ownerId),
	],
);

export const customerTags = pgTable(
	"customer_tags",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color"),
	},
	(table) => [
		uniqueIndex("customer_tags_team_name_key").using(
			"btree",
			table.teamId,
			table.name,
		),
	],
);

export const customerTagAssignments = pgTable(
	"customer_tag_assignments",
	{
		customerId: uuid("customer_id")
			.notNull()
			.references(() => customers.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => customerTags.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.customerId, table.tagId] })],
);

export const teamGoals = pgTable(
	"team_goals",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		customerId: uuid("customer_id").references(() => customers.id, {
			onDelete: "set null",
		}),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		title: text("title").notNull(),
		goalType: text("goal_type").notNull(),
		status: text("status").default("active"),
		successMetrics: jsonb("success_metrics"),
		docRefs: jsonb("doc_refs"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("team_goals_team_id_idx").using("btree", table.teamId),
		index("team_goals_customer_id_idx").using("btree", table.customerId),
	],
);

// ============================================================================
// SOURCE & INGESTION TABLES
// ============================================================================

export const sources = pgTable(
	"sources",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		type: text("type").notNull(), // rss, youtube_channel, youtube_search, pdf, etc.
		name: text("name"),
		url: text("url"),
		authorityScore: numeric("authority_score", { precision: 3, scale: 2 }),
		isActive: boolean("is_active").default(true),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("sources_type_idx").using("btree", table.type),
		index("sources_active_idx").using("btree", table.isActive),
	],
);

export const sourceConnections = pgTable(
	"source_connections",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		sourceId: uuid("source_id")
			.notNull()
			.references(() => sources.id, { onDelete: "cascade" }),
		syncStatus: text("sync_status").default("active"),
		lastSyncedAt: timestamp("last_synced_at", {
			withTimezone: true,
			mode: "string",
		}),
		filters: jsonb("filters"),
	},
	(table) => [
		uniqueIndex("source_connections_team_source_key").using(
			"btree",
			table.teamId,
			table.sourceId,
		),
	],
);

export const discoveries = pgTable(
	"discoveries",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		sourceId: uuid("source_id")
			.notNull()
			.references(() => sources.id, { onDelete: "cascade" }),
		externalId: text("external_id").notNull(),
		title: text("title"),
		url: text("url"),
		status: text("status").default("pending"),
		publishedAt: timestamp("published_at", {
			withTimezone: true,
			mode: "string",
		}),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("discoveries_source_external_key").using(
			"btree",
			table.sourceId,
			table.externalId,
		),
		index("discoveries_status_idx").using("btree", table.status),
	],
);

export const contents = pgTable(
	"contents",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		discoveryId: uuid("discovery_id")
			.notNull()
			.references(() => discoveries.id, { onDelete: "cascade" }),
		contentType: text("content_type").notNull(), // text, transcript, pdf, etc.
		textBody: text("text_body"),
		durationSeconds: integer("duration_seconds"),
		transcriptUrl: text("transcript_url"),
		languageCode: text("language_code"),
		extractedAt: timestamp("extracted_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("contents_discovery_idx").using("btree", table.discoveryId),
	],
);

// ============================================================================
// STORY & CLUSTER TABLES
// ============================================================================

export const storyClusters = pgTable(
	"story_clusters",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		clusterKey: text("cluster_key").notNull(),
		label: text("label"),
		primaryStoryId: uuid("primary_story_id"),
		metrics: jsonb("metrics"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("story_clusters_key").using("btree", table.clusterKey),
		index("story_clusters_primary_story_idx").using(
			"btree",
			table.primaryStoryId,
		),
	],
);

export const stories = pgTable(
	"stories",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		contentId: uuid("content_id")
			.notNull()
			.references(() => contents.id, { onDelete: "cascade" }),
		clusterId: uuid("cluster_id").references(() => storyClusters.id, {
			onDelete: "set null",
		}),
		primarySourceId: uuid("primary_source_id").references(() => sources.id, {
			onDelete: "set null",
		}),
		title: text("title"),
		summary: text("summary"),
		kind: storyKind("kind").notNull().default("article"),
		primaryUrl: text("primary_url"),
		publishedAt: timestamp("published_at", {
			withTimezone: true,
			mode: "string",
		}),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("stories_cluster_idx").using("btree", table.clusterId),
		index("stories_source_idx").using("btree", table.primarySourceId),
		index("stories_published_at_idx").using("btree", table.publishedAt),
	],
);

// Add foreign key constraint after story_clusters table is defined
export const storyClustersFk = foreignKey({
	columns: [storyClusters.primaryStoryId],
	foreignColumns: [stories.id],
	name: "story_clusters_primary_story_fkey",
});

export const storyAssets = pgTable(
	"story_assets",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		assetType: text("asset_type").notNull(), // video, audio, image, pdf
		externalUrl: text("external_url").notNull(), // YouTube URL, etc.
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("story_assets_story_idx").using("btree", table.storyId),
		index("story_assets_type_idx").using("btree", table.assetType),
	],
);

// ============================================================================
// AUTHOR & CATEGORY TABLES
// ============================================================================

export const authors = pgTable(
	"authors",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		avatarUrl: text("avatar_url"),
		profileUrl: text("profile_url"),
	},
	(table) => [uniqueIndex("authors_slug_key").using("btree", table.slug)],
);

export const storyAuthors = pgTable(
	"story_authors",
	{
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		authorId: uuid("author_id")
			.notNull()
			.references(() => authors.id, { onDelete: "cascade" }),
		role: text("role").default("author"),
		position: integer("position").notNull().default(0),
	},
	(table) => [primaryKey({ columns: [table.storyId, table.authorId] })],
);

export const storyCategories = pgTable(
	"story_categories",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		slug: text("slug").notNull(),
		name: text("name").notNull(),
		description: text("description"),
	},
	(table) => [
		uniqueIndex("story_categories_slug_key").using("btree", table.slug),
	],
);

export const storyCategoryLinks = pgTable(
	"story_category_links",
	{
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => storyCategories.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.storyId, table.categoryId] })],
);

export const storyTags = pgTable(
	"story_tags",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		tag: text("tag").notNull(),
		createdBy: uuid("created_by").references(() => users.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("story_tags_story_idx").using("btree", table.storyId),
		index("story_tags_tag_idx").using("btree", table.tag),
	],
);

export const storyTagEmbeddings = pgTable(
	"story_tag_embeddings",
	{
		tagId: uuid("tag_id")
			.primaryKey()
			.references(() => storyTags.id, { onDelete: "cascade" }),
		modelVersion: text("model_version").notNull(),
		embedding: vector("embedding", { dimensions: 1536 }),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("story_tag_embeddings_model_idx").using("btree", table.modelVersion),
	],
);

// ============================================================================
// STORY STRUCTURE TABLES (Chapters & Turns)
// ============================================================================

export const storyChapters = pgTable(
	"story_chapters",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		title: text("title"),
		summary: text("summary"),
		startSeconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		endSeconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		index("story_chapters_story_idx").using("btree", table.storyId),
		index("story_chapters_position_idx").using("btree", table.position),
	],
);

export const storyTurns = pgTable(
	"story_turns",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		chapterId: uuid("chapter_id").references(() => storyChapters.id, {
			onDelete: "set null",
		}),
		speaker: text("speaker"),
		startSeconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		endSeconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		content: text("content"),
		position: integer("position").notNull().default(0),
	},
	(table) => [
		index("story_turns_story_idx").using("btree", table.storyId),
		index("story_turns_chapter_idx").using("btree", table.chapterId),
		index("story_turns_position_idx").using("btree", table.position),
	],
);

// ============================================================================
// STORY ANALYSIS TABLES
// ============================================================================

export const storyEmbeddings = pgTable("story_embeddings", {
	storyId: uuid("story_id")
		.primaryKey()
		.notNull()
		.references(() => stories.id, { onDelete: "cascade" }),
	modelVersion: text("model_version"),
	embedding: vector("embedding", { dimensions: 1536 }),
	updatedAt: timestamp("updated_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

export const storyOverlays = pgTable("story_overlays", {
	storyId: uuid("story_id")
		.primaryKey()
		.notNull()
		.references(() => stories.id, { onDelete: "cascade" }),
	whyItMatters: text("why_it_matters"),
	confidence: numeric("confidence", { precision: 3, scale: 2 }),
	citations: jsonb("citations"),
	analysisState: text("analysis_state").default("pending"),
	analyzedAt: timestamp("analyzed_at", { withTimezone: true, mode: "string" }),
});

// ============================================================================
// HIGHLIGHT TABLES
// ============================================================================

export const highlights = pgTable(
	"highlights",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }), // null = global
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		chapterId: uuid("chapter_id").references(() => storyChapters.id, {
			onDelete: "set null",
		}),
		kind: highlightKind("kind").notNull().default("insight"),
		title: text("title"),
		summary: text("summary"),
		quote: text("quote"),
		startSeconds: numeric("start_seconds", { precision: 10, scale: 2 }),
		endSeconds: numeric("end_seconds", { precision: 10, scale: 2 }),
		confidence: numeric("confidence", { precision: 3, scale: 2 }),
		isGenerated: boolean("is_generated").default(false),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("highlights_story_idx").using("btree", table.storyId),
		index("highlights_team_idx").using("btree", table.teamId),
		index("highlights_chapter_idx").using("btree", table.chapterId),
	],
);

export const highlightReferences = pgTable(
	"highlight_references",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		highlightId: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
		turnId: uuid("turn_id")
			.notNull()
			.references(() => storyTurns.id, { onDelete: "cascade" }),
		sourceUrl: text("source_url"),
	},
	(table) => [
		index("highlight_refs_highlight_idx").using("btree", table.highlightId),
		index("highlight_refs_turn_idx").using("btree", table.turnId),
	],
);

export const highlightTags = pgTable(
	"highlight_tags",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		highlightId: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
		tag: text("tag").notNull(),
	},
	(table) => [
		index("highlight_tags_highlight_idx").using("btree", table.highlightId),
		index("highlight_tags_tag_idx").using("btree", table.tag),
	],
);

// ============================================================================
// TEAM STATE TABLES
// ============================================================================

export const teamHighlightStates = pgTable(
	"team_highlight_states",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		highlightId: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
		state: text("state").default("active"), // active, archived, etc.
		pinnedBy: uuid("pinned_by").references(() => users.id, {
			onDelete: "set null",
		}),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		uniqueIndex("team_highlight_states_key").using(
			"btree",
			table.teamId,
			table.highlightId,
		),
	],
);

export const teamStoryStates = pgTable(
	"team_story_states",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		state: text("state").default("unread"), // unread, read, archived
		pinned: boolean("pinned").default(false),
		rating: integer("rating"),
		lastViewedAt: timestamp("last_viewed_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		uniqueIndex("team_story_states_key").using(
			"btree",
			table.teamId,
			table.storyId,
		),
		index("team_story_states_pinned_idx").using("btree", table.pinned),
	],
);

export const storyNotes = pgTable(
	"story_notes",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		storyId: uuid("story_id")
			.notNull()
			.references(() => stories.id, { onDelete: "cascade" }),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		visibility: text("visibility").notNull().default("team"), // team, personal
		body: text("body").notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("story_notes_story_team_idx").using(
			"btree",
			table.storyId,
			table.teamId,
		),
	],
);

// ============================================================================
// PLAYBOOK TABLES
// ============================================================================

export const playbookTemplates = pgTable(
	"playbook_templates",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		title: text("title").notNull(),
		description: text("description"),
		targetRole: text("target_role"),
		defaultChannel: text("default_channel"),
		isPublic: boolean("is_public").default(false),
		metadata: jsonb("metadata"),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("playbook_templates_public_idx").using("btree", table.isPublic),
	],
);

export const playbookTemplateSteps = pgTable(
	"playbook_template_steps",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		templateId: uuid("template_id")
			.notNull()
			.references(() => playbookTemplates.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		outputType: text("output_type"),
		position: integer("position").notNull().default(0),
		defaultPayload: jsonb("default_payload"),
	},
	(table) => [
		index("playbook_template_steps_template_idx").using(
			"btree",
			table.templateId,
		),
		index("playbook_template_steps_position_idx").using(
			"btree",
			table.position,
		),
	],
);

export const playbooks = pgTable(
	"playbooks",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		storyId: uuid("story_id").references(() => stories.id, {
			onDelete: "set null",
		}),
		templateId: uuid("template_id").references(() => playbookTemplates.id, {
			onDelete: "set null",
		}),
		customerId: uuid("customer_id").references(() => customers.id, {
			onDelete: "set null",
		}),
		goalId: uuid("goal_id").references(() => teamGoals.id, {
			onDelete: "set null",
		}),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		status: playbookStatus("status").notNull().default("draft"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		publishedAt: timestamp("published_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index("playbooks_team_idx").using("btree", table.teamId),
		index("playbooks_story_idx").using("btree", table.storyId),
		index("playbooks_customer_idx").using("btree", table.customerId),
		index("playbooks_status_idx").using("btree", table.status),
	],
);

export const playbookSteps = pgTable(
	"playbook_steps",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbookId: uuid("playbook_id")
			.notNull()
			.references(() => playbooks.id, { onDelete: "cascade" }),
		templateStepId: uuid("template_step_id").references(
			() => playbookTemplateSteps.id,
			{ onDelete: "set null" },
		),
		assignedTo: uuid("assigned_to").references(() => users.id, {
			onDelete: "set null",
		}),
		status: stepStatus("status").notNull().default("pending"),
		content: text("content"),
		position: integer("position").notNull().default(0),
		completedAt: timestamp("completed_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index("playbook_steps_playbook_idx").using("btree", table.playbookId),
		index("playbook_steps_position_idx").using("btree", table.position),
	],
);

export const playbookStepHighlights = pgTable(
	"playbook_step_highlights",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbookStepId: uuid("playbook_step_id")
			.notNull()
			.references(() => playbookSteps.id, { onDelete: "cascade" }),
		highlightId: uuid("highlight_id")
			.notNull()
			.references(() => highlights.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("playbook_step_highlights_key").using(
			"btree",
			table.playbookStepId,
			table.highlightId,
		),
	],
);

export const playbookOutputs = pgTable(
	"playbook_outputs",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		playbookId: uuid("playbook_id")
			.notNull()
			.references(() => playbooks.id, { onDelete: "cascade" }),
		outputType: text("output_type").notNull(),
		externalUrl: text("external_url"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("playbook_outputs_playbook_idx").using("btree", table.playbookId),
	],
);

// ============================================================================
// ASSISTANT TABLES
// ============================================================================

export const assistantThreads = pgTable(
	"assistant_threads",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		storyId: uuid("story_id").references(() => stories.id, {
			onDelete: "set null",
		}),
		playbookId: uuid("playbook_id").references(() => playbooks.id, {
			onDelete: "set null",
		}),
		goalId: uuid("goal_id").references(() => teamGoals.id, {
			onDelete: "set null",
		}),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		topic: text("topic"),
		status: threadStatus("status").notNull().default("active"),
		startedAt: timestamp("started_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("assistant_threads_team_idx").using("btree", table.teamId),
		index("assistant_threads_story_idx").using("btree", table.storyId),
		index("assistant_threads_status_idx").using("btree", table.status),
	],
);

export const assistantThreadSources = pgTable(
	"assistant_thread_sources",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		threadId: uuid("thread_id")
			.notNull()
			.references(() => assistantThreads.id, { onDelete: "cascade" }),
		highlightId: uuid("highlight_id").references(() => highlights.id, {
			onDelete: "cascade",
		}),
		turnId: uuid("turn_id").references(() => storyTurns.id, {
			onDelete: "cascade",
		}),
		addedBy: uuid("added_by")
			.notNull()
			.references(() => users.id),
		position: integer("position").notNull().default(0),
		addedAt: timestamp("added_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("assistant_thread_sources_thread_idx").using("btree", table.threadId),
	],
);

export const assistantMessages = pgTable(
	"assistant_messages",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		threadId: uuid("thread_id")
			.notNull()
			.references(() => assistantThreads.id, { onDelete: "cascade" }),
		senderId: uuid("sender_id").references(() => users.id, {
			onDelete: "set null",
		}),
		role: messageRole("role").notNull(),
		body: text("body").notNull(),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("assistant_messages_thread_idx").using("btree", table.threadId),
		index("assistant_messages_created_idx").using("btree", table.createdAt),
	],
);

export const messageSourceLinks = pgTable(
	"message_source_links",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		messageId: uuid("message_id")
			.notNull()
			.references(() => assistantMessages.id, { onDelete: "cascade" }),
		highlightId: uuid("highlight_id").references(() => highlights.id, {
			onDelete: "cascade",
		}),
		turnId: uuid("turn_id").references(() => storyTurns.id, {
			onDelete: "cascade",
		}),
		confidence: numeric("confidence", { precision: 3, scale: 2 }),
	},
	(table) => [
		index("message_source_links_message_idx").using("btree", table.messageId),
	],
);

export const activities = pgTable(
	"activities",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		actorId: uuid("actor_id").references(() => users.id, {
			onDelete: "set null",
		}),
		type: activityTypeEnum("type").notNull(),
		visibility: activityVisibilityEnum("visibility").notNull().default("team"),
		storyId: uuid("story_id").references(() => stories.id, {
			onDelete: "set null",
		}),
		highlightId: uuid("highlight_id").references(() => highlights.id, {
			onDelete: "set null",
		}),
		playbookId: uuid("playbook_id").references(() => playbooks.id, {
			onDelete: "set null",
		}),
		threadId: uuid("thread_id").references(() => assistantThreads.id, {
			onDelete: "set null",
		}),
		goalId: uuid("goal_id").references(() => teamGoals.id, {
			onDelete: "set null",
		}),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("activities_team_idx").using("btree", table.teamId),
		index("activities_type_idx").using("btree", table.type),
		index("activities_created_at_idx").using("btree", table.createdAt),
	],
);

// ============================================================================
// ANALYTICS VIEWS (support stats + dashboards per ERD spec)
// ============================================================================

export const storyMetricsView = pgView("story_metrics_view").as(sql
	select
		tss.story_id,
		tss.team_id,
		count(*) filter (where tss.state = 'read')::bigint as read_count,
		count(*) filter (where tss.state = 'unread')::bigint as unread_count,
		count(*) filter (where tss.state = 'archived')::bigint as archived_count,
		count(*) filter (where tss.pinned is true)::bigint as pinned_count,
		avg(tss.rating)::numeric as average_rating,
		max(tss.last_viewed_at) as last_viewed_at
	from ${teamStoryStates} as tss
	group by tss.story_id, tss.team_id
);

export const highlightEngagementView = pgView("highlight_engagement_view").as(
	sql
	with state_counts as (
		select
			ths.highlight_id,
			ths.team_id,
			count(*) filter (where ths.state = 'active')::bigint as active_count,
			count(*) filter (where ths.state = 'archived')::bigint as archived_count,
			count(*) filter (where ths.pinned_by is not null)::bigint as pinned_count,
			max(ths.updated_at) as last_updated_at
		from ${teamHighlightStates} as ths
		group by ths.highlight_id, ths.team_id
	),
	playbook_links as (
		select
			psh.highlight_id,
			p.team_id,
			count(distinct psh.playbook_step_id)::bigint as linked_playbook_steps
		from ${playbookStepHighlights} as psh
		join ${playbookSteps} as ps on ps.id = psh.playbook_step_id
		join ${playbooks} as p on p.id = ps.playbook_id
		group by psh.highlight_id, p.team_id
	),
	thread_links as (
		select
			ats.highlight_id,
			at.team_id,
			count(distinct ats.thread_id)::bigint as linked_threads
		from ${assistantThreadSources} as ats
		join ${assistantThreads} as at on at.id = ats.thread_id
		where ats.highlight_id is not null
		group by ats.highlight_id, at.team_id
	)
	select
		coalesce(sc.highlight_id, pl.highlight_id, tl.highlight_id) as highlight_id,
		coalesce(sc.team_id, pl.team_id, tl.team_id) as team_id,
		coalesce(sc.active_count, 0)::bigint as active_count,
		coalesce(sc.archived_count, 0)::bigint as archived_count,
		coalesce(sc.pinned_count, 0)::bigint as pinned_count,
		coalesce(pl.linked_playbook_steps, 0)::bigint as linked_playbook_steps,
		coalesce(tl.linked_threads, 0)::bigint as linked_threads,
		sc.last_updated_at
	from state_counts sc
	full outer join playbook_links pl
		on pl.highlight_id = sc.highlight_id and pl.team_id = sc.team_id
	full outer join thread_links tl
		on tl.highlight_id = coalesce(sc.highlight_id, pl.highlight_id)
		and tl.team_id = coalesce(sc.team_id, pl.team_id)
,
);

export const playbookProgressView = pgView("playbook_progress_view").as(sql
	select
		p.id as playbook_id,
		p.team_id,
		count(ps.id)::bigint as total_steps,
		count(*) filter (where ps.status = 'completed')::bigint as completed_steps,
		count(*) filter (where ps.status = 'in_progress')::bigint as in_progress_steps,
		count(*) filter (where ps.status = 'pending')::bigint as pending_steps,
		count(*) filter (where ps.status = 'skipped')::bigint as skipped_steps,
		case
			when count(ps.id) = 0 then 0
			else round(count(*) filter (where ps.status = 'completed')::numeric / count(ps.id)::numeric * 100, 2)
		end as completion_percent,
		max(ps.completed_at) as last_completed_at
	from ${playbooks} as p
	left join ${playbookSteps} as ps on ps.playbook_id = p.id
	group by p.id, p.team_id
);

// ============================================================================
// BILLING TABLES (Stripe Integration)
// ============================================================================

export const products = pgTable(
	"products",
	{
		id: text("id").primaryKey().notNull(), // Stripe product ID
		name: text("name").notNull(),
		description: text("description"),
		active: boolean("active").default(true),
		metadata: jsonb("metadata"),
	},
	(table) => [index("products_active_idx").using("btree", table.active)],
);

export const prices = pgTable(
	"prices",
	{
		id: text("id").primaryKey().notNull(), // Stripe price ID
		productId: text("product_id")
			.notNull()
			.references(() => products.id),
		active: boolean("active").default(true),
		currency: text("currency").notNull(),
		type: pricingType("type").notNull(),
		unitAmount: bigint("unit_amount", { mode: "number" }),
		interval: pricingPlanInterval("interval"),
		intervalCount: integer("interval_count"),
		metadata: jsonb("metadata"),
	},
	(table) => [
		index("prices_product_idx").using("btree", table.productId),
		index("prices_active_idx").using("btree", table.active),
	],
);

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: text("id").primaryKey().notNull(), // Stripe subscription ID
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id),
		priceId: text("price_id")
			.notNull()
			.references(() => prices.id),
		status: subscriptionStatus("status").notNull(),
		planCode: planCodeEnum("plan_code").notNull(),
		currentPeriodStart: timestamp("current_period_start", {
			withTimezone: true,
			mode: "string",
		}),
		currentPeriodEnd: timestamp("current_period_end", {
			withTimezone: true,
			mode: "string",
		}),
		trialEndsAt: timestamp("trial_ends_at", {
			withTimezone: true,
			mode: "string",
		}),
		canceledAt: timestamp("canceled_at", {
			withTimezone: true,
			mode: "string",
		}),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("subscriptions_team_idx").using("btree", table.teamId),
		index("subscriptions_status_idx").using("btree", table.status),
		index("subscriptions_plan_code_idx").using("btree", table.planCode),
	],
);

// ============================================================================
// OPERATIONAL TABLES (Keep for instrumentation)
// ============================================================================

export const platformQuota = pgTable("platform_quota", {
	provider: text("provider").primaryKey().notNull(),
	quotaLimit: integer("quota_limit"),
	used: integer("used"),
	remaining: integer("remaining"),
	resetAt: timestamp("reset_at", { withTimezone: true, mode: "string" }),
	updatedAt: timestamp("updated_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

export const sourceHealth = pgTable("source_health", {
	sourceId: uuid("source_id")
		.primaryKey()
		.notNull()
		.references(() => sources.id, { onDelete: "cascade" }),
	status: healthStatus("status").notNull(),
	lastSuccessAt: timestamp("last_success_at", {
		withTimezone: true,
		mode: "string",
	}),
	lastErrorAt: timestamp("last_error_at", {
		withTimezone: true,
		mode: "string",
	}),
	message: text("message"),
	updatedAt: timestamp("updated_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

export const jobMetrics = pgTable(
	"job_metrics",
	{
		name: text("name").notNull(),
		state: text("state").notNull(),
		count: integer("count").notNull().default(0),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.name, table.state] })],
);

// ============================================================================
// TODO: team_state deferred per plan
// This is a placeholder for future team state management features
// ============================================================================

// TODO: Implement team_state management in a future iteration
// This will include features like workspace preferences, team-wide settings,
// and collaborative state that spans multiple entities
ChatGPT said:
Thanks for sharing your schema – it's impressively complete. To help you improve readability and clarify what to change, could you let me know:

Are you mainly looking to make the schema more readable for internal devs? For onboarding new teammates? Or for external partners?

Should I prioritize naming consistency, reducing nesting/duplication, adding documentation comments, visual ERD, or rethinking table/field structure?

Are there specific parts (like story ingestion, playbooks, or user goals) that feel hardest to navigate right now?

Once I have that context, I can provide concrete edits and visual clarity recommendations.

You said:
I'm trying to make it so that it makes more sense. Example, we get raw content. We turn that into embeddings. I just want the data pipeline to match the scheme design better.
ChatGPT said:
Thanks! I’ll review your schema and restructure it so that it more clearly aligns with the actual data pipeline:

Ingest → Content → Embedding → Analysis → Application (Highlights, Playbooks, Outputs)

I’ll identify confusing naming or structure mismatches

I’ll propose schema renames, table grouping, and comments to match your ingestion/analysis pipeline

I’ll also surface missing pieces or fragmentation that could complicate scaling the system

You’ll get a clean schema blueprint that mirrors the way Zeke’s engine thinks and operates.

Research completed in 5m · 4 sources · 3 searches
Refactor Schema for Pipeline Clarity and Data Flow Alignment

Proposed Data Schema Design (Content Intelligence Pipeline)
To make the schema easier to read and better aligned with the content pipeline, we can organize it into clear stages. Below is a simplified schema design grouping tables by their role in the pipeline (from raw content ingestion to embeddings and user interactions), along with suggested naming improvements for clarity:
1. Ingestion Stage: Sources & Raw Items
Tables: sources, source_connections, raw_items (was discoveries).
Sources: Defines external content sources (e.g. RSS feed, YouTube channel) with fields like name, URL, type, etc. Each source can produce many raw items
GitHub
.
Source Connections: Associates sources to teams (for multi-tenant setups). This table links a team to a source (with an optional filter or config) to indicate the team is ingesting that source’s content.
Raw Items: (Rename discoveries ➞ raw_items for clarity.) Each raw item represents a piece of content discovered from a source – essentially a queue of content to fetch. It stores minimal metadata (source ID, external ID, URL, title, timestamps)
GitHub
. This stage is the “raw content” before any text extraction. (Renaming “discoveries” to “raw_items” makes its role clear in the pipeline.)
2. Extraction Stage: Content Records
Table: contents (or consider renaming to extracted_content for clarity).
Contents: Once a raw item is fetched and processed, the full text or transcript is stored here
GitHub
. Each content record typically corresponds one-to-one with a raw item (raw_item_id as a foreign key)
GitHub
. Key fields might include the text body, content type (e.g. “text”, “transcript”), language, duration (for media), and extraction timestamp. This stage represents the normalized, clean content extracted from the raw source (e.g. parsed HTML text or transcribed audio).
📌 Schema simplification: Ensure there’s a clear link from raw_items to contents (e.g. a raw_item_id FK in contents, as in the current schema). Using the name raw_item_id (instead of a generic discovery_id) in the contents table makes the relationship obvious.
3. Processing Stage: Stories & Clusters
Tables: stories, story_clusters (could simply be called clusters).
Stories: Represents a processed content item ready for users. Each story links to the content (content_id FK)
GitHub
 and includes additional metadata like title, summary, kind (article, video, etc.), canonical URL, and timestamps. Essentially, if a content record is the raw text, the story is the enriched representation (with maybe some NLP processing or summarization applied). In practice, there is typically a 1–1 relationship between content and story
GitHub
.
💡 Possible simplification: Since contents and stories are 1:1 in the current design
GitHub
, you could merge them into a single “Document” table to simplify. However, keeping them separate can be useful for pipeline clarity and de-duplication. For instance, if two raw items yield identical content, you might insert one content/story and have others reference the same story instead of duplicating records
GitHub
.
Story Clusters: Groups related stories (e.g. near-duplicate or same-topic stories). A cluster has a stable cluster_key and may designate a primary story representative. Each cluster can have many stories
GitHub
GitHub
. This helps organize content by topic or de-dup content across sources. (For readability, naming it just clusters is fine, since it already lives in a context with stories. The schema currently uses story_clusters, which is also clear.)
4. Analysis Stage: Embeddings & Overlays
Tables: story_embeddings, story_overlays.
Story Embeddings: Stores the vector embedding for each story’s content (for semantic search or similarity). Each record links to a story (story_id PK/FK) and contains the embedding vector (e.g. 1536-dim) and model info. By linking on story, it directly ties to the text content that was embedded
GitHub
. (For clarity, ensure the table name reflects its purpose; story_embeddings is fine, or you could call it content_embeddings if you merged stories/contents.)
Story Overlays: Stores additional LLM-generated analysis for a story – e.g. “why it matters” summaries, confidence scores, citation data, etc. Each overlays record is identified by story_id. This table represents AI-generated insights layered on the story. Key fields could include a summary (“why_it_matters”), a JSON of citation links, a confidence score, and an analysis status.
Both embeddings and overlays are derived from stories during analysis jobs (LLM or embedding service). In the pipeline, once a story is created, an async job can generate an embedding and overlay for it
GitHub
.
For better readability: Keep these analysis outputs clearly named with the story_ prefix (as they are) so it’s obvious they depend on the story. The schema already indicates a story has many of these derived records
GitHub
.
5. User Annotation Stage: Highlights & References
Tables: highlights, highlight_references, highlight_tags.
Highlights: Represents snippets or notes extracted from a story’s content (either auto-generated insights or user-created highlights). A highlight links to the related story (story_id) and optionally to a team (for team-specific highlights vs global). Fields include the kind/type (insight, quote, action, question), the text quote or summary, time offsets (for video/audio content), a confidence score if applicable, etc. Highlights can be generated by the system or created by users during reading.
Highlight References: Since highlights often refer to specific parts of the content, this table links a highlight to the exact source segment – e.g. a reference to a story_turn (for a specific speaker turn in a transcript) or a chapter. It may also store a source URL if the highlight came from an external context. This anchors highlights to the original content (text span or timestamp).
Highlight Tags: Allows tagging highlights with keywords. Each tag record links to a highlight and stores a tag string. (This is separate from story tags; these tags categorize individual highlights.) These tables enable users to interact with content. For example, when a user highlights a passage, a new highlight is created referencing the story and the content span
GitHub
. The design here is already fairly clear – just ensure naming is consistent (e.g., using highlight_references instead of something generic).
6. Consumption Stage: Team States & Notes
Tables: team_story_states, team_highlight_states, story_notes.
Team Story States: Per-team status for stories (whether a story is unread, read, archived for that team). It also tracks if the story is pinned, a rating, and last viewed timestamp. This allows each team to manage their view of the content (e.g. pin important stories, mark as read).
Team Highlight States: Similar concept for highlights – whether a highlight is active or archived for a team, and who pinned it. This helps teams curate highlights (e.g. pin key insights for the team) without altering the underlying highlight data.
Story Notes: Free-form notes that team members can attach to a story. Each note is tied to a story, team, and user, with a visibility setting (team-wide or personal). This provides a place for additional commentary on a story. These tables make the schema multi-tenant and collaborative. For better readability, the naming is already descriptive (each is clearly prefixed with team_ or story_ and suffixed with state or notes). Just document their purpose as above so it’s clear how they relate to stories and highlights.
7. Playbooks & Workflow Stage
Tables: playbook_templates, playbooks, playbook_steps, playbook_step_highlights, playbook_outputs.
Playbook Templates: Define reusable frameworks (sequences of steps) for workflows (e.g. a sales playbook or research workflow). Contains metadata like title, description, target role, default channel, etc., and who created it.
Playbooks: An instance of a playbook template launched by a team (optionally linked to a specific story, customer, or goal). Tracks the status (draft, active, published, etc.), associated story or customer, and creation info.
Playbook Steps: The concrete steps of a playbook instance. Each step may reference a template step definition, an assigned user, status (pending, completed, etc.), content (e.g. notes or output of that step), and completion timestamp. position defines the order.
Playbook Step Highlights: Join table linking highlights to playbook steps (if a step involves discussing or using certain highlights). This allows embedding story insights directly into a playbook workflow.
Playbook Outputs: Records outputs or deliverables produced by a playbook (e.g. a link to an external document, or generated content). It stores the playbook ID, type of output, a URL if applicable, and any metadata. These tables support guided workflows using the content. They are separate from the core content pipeline, but their schema is already organized with clear prefixes (playbook_*). To improve readability, ensure that the relationships (template → playbook → steps, etc.) are well-documented.
8. Assistant (Chat) Stage
Tables: assistant_threads, assistant_messages, assistant_thread_sources, message_source_links.
Assistant Threads: Represents a Q&A or chat session (thread) within a team, often tied to content. Each thread can optionally link to a story, playbook, or goal (if the conversation is about a specific item). It has a status (active, resolved, archived), a topic, and tracks who started it and when.
Assistant Messages: The messages within a thread. Each message has a role (user, assistant, or system), the message body, and metadata (e.g. tokens, response time). Messages may optionally link to a sender user (for user messages) while assistant/system messages have no user.
Assistant Thread Sources: Links content pieces into an assistant thread context. For example, if a user brings in a particular highlight or story turn as context for the AI assistant, this table records that (thread_id, plus either a highlight_id or turn_id). It helps the assistant ground its answers on specific sources.
Message Source Links: After the assistant answers, this table can link an assistant message to the specific highlight or story turn that supports it, along with a confidence score. Essentially, it’s a citation system for the AI’s responses (so users can see which highlight or content segment backs a given assistant message). The assistant tables enable an AI helper that uses the content. The schema here is already fairly clear, with names indicating their usage. Just ensure foreign keys and their purpose are clearly noted (e.g. a thread can have many messages; a message can have many source links, etc.).
9. Activity Log and Miscellaneous
Tables: activities, plus Billing (products, prices, subscriptions) and Ops (platform_quota, source_health, job_metrics).
Activities: A unified activity log for noteworthy events (story published, highlight created, playbook published, subscription changes, etc.). Each row can reference various entities (story, highlight, playbook, etc.) and has an actor (user) and visibility (team, personal, system). This is useful for building an activity feed.
Billing Tables: These track Stripe products, prices, and team subscriptions. They are mostly standard for a SaaS app. For readability, they’re separate from the content pipeline schema – you might document them in a Billing section to avoid mixing with content tables.
Operational Tables: E.g. platform_quota for API usage quotas, source_health for monitoring source sync status (ok/warn/error with timestamps), and job_metrics for tracking background job counts. These support monitoring and should be documented as such, separate from the core product logic.
Key Schema Changes for Clarity
Based on the above, here are the main changes we’d make to improve readability and alignment with the data pipeline:
Rename confusing tables to pipeline terms: For example, rename discoveries → raw_items to clearly indicate these are newly discovered content items awaiting processing
GitHub
. This matches the terminology in our design docs and makes the ingestion stage obvious. Likewise, using raw_item_id as the foreign key in contents (instead of a generic name) clarifies that relationship.
Emphasize one-to-one pipeline links: Document or enforce that each raw item yields one content, and each content yields one story
GitHub
. In the schema, this is already implied by one-to-one relations (e.g. unique indexes on raw_item_id in contents, and content_id in stories). Making these constraints explicit (and maybe combining tables if one-to-one is always true) can simplify understanding. For instance, a “Content (Story) ID” could serve as a single identifier for the content piece through its lifecycle.
Use consistent naming conventions: The schema is easier to read if naming reflects hierarchy. The current design is good in that regard (using prefixes like story_, team_, playbook_, etc.). We would maintain that, and ensure columns are named intuitively (e.g. createdAt vs created_at – stick to one style). Minor tweaks: consider story_overlays instead of storyOverlays for consistency (most tables use snake_case). Consistency helps new readers follow the design quickly.
Group related tables in documentation or code: In your schema file, you already separate sections with comments. We’d go further by perhaps splitting the schema into multiple files or documentation sections: Content Pipeline, Team/Collaboration, Playbooks, Assistant, etc. This way, someone reading the schema can follow the content’s journey (from raw item to embedding) without being distracted by orthogonal sections like billing. In documentation, an ER diagram focusing on the content flow is helpful. For example, illustrating how raw_items → contents → stories → (overlays, embeddings, clusters) connect
GitHub
 makes the design much easier to grasp.
Document the data flow with examples: To match the schema to the pipeline, provide a brief narrative (like: “Ingestion: The system pulls sources and creates raw_items; Extraction: a engine fetches each raw_item’s content into contents; Story Creation: content is saved as a story for users to read; Analysis: an LLM generates a story_overlay and vector in story_embeddings
GitHub
; User Curation: users highlight passages, which get saved in highlights referencing the story’s content
GitHub
, etc.”). This ties the schema design to real usage, making it more intuitive.
By implementing the above changes – especially clarifying table names/relationships and organizing the schema by pipeline stages – the data model will be much easier to read and reason about. The goal is that anyone looking at the schema or ER diagram can quickly follow the content’s lifecycle from raw input to embedded intelligence, and see how each part of the system (highlights, playbooks, assistant, etc.) connects to that core pipeline. This alignment of schema design with the data flow will improve both developer understanding and future maintainability.
GitHub
GitHub

Sources



No file chosenNo file chosen
ChatGPT can make mistakes. Check important info.

Proposed Data Schema Design (Content Intelligence Pipeline)
To make the schema easier to read and better aligned with the content pipeline, we can organize it into clear stages. Below is a simplified schema design grouping tables by their role in the pipeline (from raw content ingestion to embeddings and user interactions), along with suggested naming improvements for clarity:
1. Ingestion Stage: Sources & Raw Items
Tables: sources, source_connections, raw_items (was discoveries).
Sources: Defines external content sources (e.g. RSS feed, YouTube channel) with fields like name, URL, type, etc. Each source can produce many raw items
GitHub
.
Source Connections: Associates sources to teams (for multi-tenant setups). This table links a team to a source (with an optional filter or config) to indicate the team is ingesting that source’s content.
Raw Items: (Rename discoveries ➞ raw_items for clarity.) Each raw item represents a piece of content discovered from a source – essentially a queue of content to fetch. It stores minimal metadata (source ID, external ID, URL, title, timestamps)
GitHub
. This stage is the “raw content” before any text extraction. (Renaming “discoveries” to “raw_items” makes its role clear in the pipeline.)
2. Extraction Stage: Content Records
Table: contents (or consider renaming to extracted_content for clarity).
Contents: Once a raw item is fetched and processed, the full text or transcript is stored here
GitHub
. Each content record typically corresponds one-to-one with a raw item (raw_item_id as a foreign key)
GitHub
. Key fields might include the text body, content type (e.g. “text”, “transcript”), language, duration (for media), and extraction timestamp. This stage represents the normalized, clean content extracted from the raw source (e.g. parsed HTML text or transcribed audio).
📌 Schema simplification: Ensure there’s a clear link from raw_items to contents (e.g. a raw_item_id FK in contents, as in the current schema). Using the name raw_item_id (instead of a generic discovery_id) in the contents table makes the relationship obvious.
3. Processing Stage: Stories & Clusters
Tables: stories, story_clusters (could simply be called clusters).
Stories: Represents a processed content item ready for users. Each story links to the content (content_id FK)
GitHub
 and includes additional metadata like title, summary, kind (article, video, etc.), canonical URL, and timestamps. Essentially, if a content record is the raw text, the story is the enriched representation (with maybe some NLP processing or summarization applied). In practice, there is typically a 1–1 relationship between content and story
GitHub
.
💡 Possible simplification: Since contents and stories are 1:1 in the current design
GitHub
, you could merge them into a single “Document” table to simplify. However, keeping them separate can be useful for pipeline clarity and de-duplication. For instance, if two raw items yield identical content, you might insert one content/story and have others reference the same story instead of duplicating records
GitHub
.
Story Clusters: Groups related stories (e.g. near-duplicate or same-topic stories). A cluster has a stable cluster_key and may designate a primary story representative. Each cluster can have many stories
GitHub
GitHub
. This helps organize content by topic or de-dup content across sources. (For readability, naming it just clusters is fine, since it already lives in a context with stories. The schema currently uses story_clusters, which is also clear.)
4. Analysis Stage: Embeddings & Overlays
Tables: story_embeddings, story_overlays.
Story Embeddings: Stores the vector embedding for each story’s content (for semantic search or similarity). Each record links to a story (story_id PK/FK) and contains the embedding vector (e.g. 1536-dim) and model info. By linking on story, it directly ties to the text content that was embedded
GitHub
. (For clarity, ensure the table name reflects its purpose; story_embeddings is fine, or you could call it content_embeddings if you merged stories/contents.)
Story Overlays: Stores additional LLM-generated analysis for a story – e.g. “why it matters” summaries, confidence scores, citation data, etc. Each overlays record is identified by story_id. This table represents AI-generated insights layered on the story. Key fields could include a summary (“why_it_matters”), a JSON of citation links, a confidence score, and an analysis status.
Both embeddings and overlays are derived from stories during analysis jobs (LLM or embedding service). In the pipeline, once a story is created, an async job can generate an embedding and overlay for it
GitHub
.
For better readability: Keep these analysis outputs clearly named with the story_ prefix (as they are) so it’s obvious they depend on the story. The schema already indicates a story has many of these derived records
GitHub
.
5. User Annotation Stage: Highlights & References
Tables: highlights, highlight_references, highlight_tags.
Highlights: Represents snippets or notes extracted from a story’s content (either auto-generated insights or user-created highlights). A highlight links to the related story (story_id) and optionally to a team (for team-specific highlights vs global). Fields include the kind/type (insight, quote, action, question), the text quote or summary, time offsets (for video/audio content), a confidence score if applicable, etc. Highlights can be generated by the system or created by users during reading.
Highlight References: Since highlights often refer to specific parts of the content, this table links a highlight to the exact source segment – e.g. a reference to a story_turn (for a specific speaker turn in a transcript) or a chapter. It may also store a source URL if the highlight came from an external context. This anchors highlights to the original content (text span or timestamp).
Highlight Tags: Allows tagging highlights with keywords. Each tag record links to a highlight and stores a tag string. (This is separate from story tags; these tags categorize individual highlights.) These tables enable users to interact with content. For example, when a user highlights a passage, a new highlight is created referencing the story and the content span
GitHub
. The design here is already fairly clear – just ensure naming is consistent (e.g., using highlight_references instead of something generic).
6. Consumption Stage: Team States & Notes
Tables: team_story_states, team_highlight_states, story_notes.
Team Story States: Per-team status for stories (whether a story is unread, read, archived for that team). It also tracks if the story is pinned, a rating, and last viewed timestamp. This allows each team to manage their view of the content (e.g. pin important stories, mark as read).
Team Highlight States: Similar concept for highlights – whether a highlight is active or archived for a team, and who pinned it. This helps teams curate highlights (e.g. pin key insights for the team) without altering the underlying highlight data.
Story Notes: Free-form notes that team members can attach to a story. Each note is tied to a story, team, and user, with a visibility setting (team-wide or personal). This provides a place for additional commentary on a story. These tables make the schema multi-tenant and collaborative. For better readability, the naming is already descriptive (each is clearly prefixed with team_ or story_ and suffixed with state or notes). Just document their purpose as above so it’s clear how they relate to stories and highlights.
7. Playbooks & Workflow Stage
Tables: playbook_templates, playbooks, playbook_steps, playbook_step_highlights, playbook_outputs.
Playbook Templates: Define reusable frameworks (sequences of steps) for workflows (e.g. a sales playbook or research workflow). Contains metadata like title, description, target role, default channel, etc., and who created it.
Playbooks: An instance of a playbook template launched by a team (optionally linked to a specific story, customer, or goal). Tracks the status (draft, active, published, etc.), associated story or customer, and creation info.
Playbook Steps: The concrete steps of a playbook instance. Each step may reference a template step definition, an assigned user, status (pending, completed, etc.), content (e.g. notes or output of that step), and completion timestamp. position defines the order.
Playbook Step Highlights: Join table linking highlights to playbook steps (if a step involves discussing or using certain highlights). This allows embedding story insights directly into a playbook workflow.
Playbook Outputs: Records outputs or deliverables produced by a playbook (e.g. a link to an external document, or generated content). It stores the playbook ID, type of output, a URL if applicable, and any metadata. These tables support guided workflows using the content. They are separate from the core content pipeline, but their schema is already organized with clear prefixes (playbook_*). To improve readability, ensure that the relationships (template → playbook → steps, etc.) are well-documented.
8. Assistant (Chat) Stage
Tables: assistant_threads, assistant_messages, assistant_thread_sources, message_source_links.
Assistant Threads: Represents a Q&A or chat session (thread) within a team, often tied to content. Each thread can optionally link to a story, playbook, or goal (if the conversation is about a specific item). It has a status (active, resolved, archived), a topic, and tracks who started it and when.
Assistant Messages: The messages within a thread. Each message has a role (user, assistant, or system), the message body, and metadata (e.g. tokens, response time). Messages may optionally link to a sender user (for user messages) while assistant/system messages have no user.
Assistant Thread Sources: Links content pieces into an assistant thread context. For example, if a user brings in a particular highlight or story turn as context for the AI assistant, this table records that (thread_id, plus either a highlight_id or turn_id). It helps the assistant ground its answers on specific sources.
Message Source Links: After the assistant answers, this table can link an assistant message to the specific highlight or story turn that supports it, along with a confidence score. Essentially, it’s a citation system for the AI’s responses (so users can see which highlight or content segment backs a given assistant message). The assistant tables enable an AI helper that uses the content. The schema here is already fairly clear, with names indicating their usage. Just ensure foreign keys and their purpose are clearly noted (e.g. a thread can have many messages; a message can have many source links, etc.).
9. Activity Log and Miscellaneous
Tables: activities, plus Billing (products, prices, subscriptions) and Ops (platform_quota, source_health, job_metrics).
Activities: A unified activity log for noteworthy events (story published, highlight created, playbook published, subscription changes, etc.). Each row can reference various entities (story, highlight, playbook, etc.) and has an actor (user) and visibility (team, personal, system). This is useful for building an activity feed.
Billing Tables: These track Stripe products, prices, and team subscriptions. They are mostly standard for a SaaS app. For readability, they’re separate from the content pipeline schema – you might document them in a Billing section to avoid mixing with content tables.
Operational Tables: E.g. platform_quota for API usage quotas, source_health for monitoring source sync status (ok/warn/error with timestamps), and job_metrics for tracking background job counts. These support monitoring and should be documented as such, separate from the core product logic.
Key Schema Changes for Clarity
Based on the above, here are the main changes we’d make to improve readability and alignment with the data pipeline:
Rename confusing tables to pipeline terms: For example, rename discoveries → raw_items to clearly indicate these are newly discovered content items awaiting processing
GitHub
. This matches the terminology in our design docs and makes the ingestion stage obvious. Likewise, using raw_item_id as the foreign key in contents (instead of a generic name) clarifies that relationship.
Emphasize one-to-one pipeline links: Document or enforce that each raw item yields one content, and each content yields one story
GitHub
. In the schema, this is already implied by one-to-one relations (e.g. unique indexes on raw_item_id in contents, and content_id in stories). Making these constraints explicit (and maybe combining tables if one-to-one is always true) can simplify understanding. For instance, a “Content (Story) ID” could serve as a single identifier for the content piece through its lifecycle.
Use consistent naming conventions: The schema is easier to read if naming reflects hierarchy. The current design is good in that regard (using prefixes like story_, team_, playbook_, etc.). We would maintain that, and ensure columns are named intuitively (e.g. createdAt vs created_at – stick to one style). Minor tweaks: consider story_overlays instead of storyOverlays for consistency (most tables use snake_case). Consistency helps new readers follow the design quickly.
Group related tables in documentation or code: In your schema file, you already separate sections with comments. We’d go further by perhaps splitting the schema into multiple files or documentation sections: Content Pipeline, Team/Collaboration, Playbooks, Assistant, etc. This way, someone reading the schema can follow the content’s journey (from raw item to embedding) without being distracted by orthogonal sections like billing. In documentation, an ER diagram focusing on the content flow is helpful. For example, illustrating how raw_items → contents → stories → (overlays, embeddings, clusters) connect
GitHub
 makes the design much easier to grasp.
Document the data flow with examples: To match the schema to the pipeline, provide a brief narrative (like: “Ingestion: The system pulls sources and creates raw_items; Extraction: a engine fetches each raw_item’s content into contents; Story Creation: content is saved as a story for users to read; Analysis: an LLM generates a story_overlay and vector in story_embeddings
GitHub
; User Curation: users highlight passages, which get saved in highlights referencing the story’s content
GitHub
, etc.”). This ties the schema design to real usage, making it more intuitive.
By implementing the above changes – especially clarifying table names/relationships and organizing the schema by pipeline stages – the data model will be much easier to read and reason about. The goal is that anyone looking at the schema or ER diagram can quickly follow the content’s lifecycle from raw input to embedded intelligence, and see how each part of the system (highlights, playbooks, assistant, etc.) connects to that core pipeline. This alignment of schema design with the data flow will improve both developer understanding and future maintainability.
GitHub
GitHub
Citations
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L102
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L116-L124
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L2-L10
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L30-L35
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L340-L344
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L106
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L210-L219
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L100-L102
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L340-L346
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L260-L265
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L101-L106
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L308-L315
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L8-L11
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L339-L346
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L260-L264
GitHub
pipeline-diagrams.md

https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L308-L314
All Sources

github