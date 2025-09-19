# Proposed Data Schema Design (Content Intelligence Pipeline)

To make the schema easier to read and better aligned with the **content
pipeline**, we can organize it into clear stages. Below is a
**simplified schema design** grouping tables by their role in the
pipeline (from raw content ingestion to embeddings and user
interactions), along with suggested naming improvements for clarity:

## 1. Ingestion Stage: **Sources & Raw Items**

**Tables:** `sources`, `source_connections`, `raw_items` (was
`discoveries`).  
- **Sources:** Defines external content sources (e.g. RSS feed, YouTube
channel) with fields like name, URL, type, etc. Each source can produce
many raw
items[\[1\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L102).  
- **Source Connections:** Associates sources to teams (for multi-tenant
setups). This table links a team to a source (with an optional filter or
config) to indicate the team is ingesting that source’s content.  
- **Raw Items:** (Rename `discoveries` ➞ `raw_items` for clarity.) Each
raw item represents a piece of content discovered from a source –
essentially a **queue of content to fetch**. It stores minimal metadata
(source ID, external ID, URL, title,
timestamps)[\[2\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L116-L124).
This stage is the **“raw content”** before any text extraction.
*(Renaming “discoveries” to “raw_items” makes its role clear in the
pipeline.)*

## 2. Extraction Stage: **Content Records**

**Table:** `contents` (or consider renaming to `extracted_content` for
clarity).  
- **Contents:** Once a raw item is fetched and processed, the **full
text or transcript** is stored
here[\[3\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L2-L10).
Each content record typically corresponds one-to-one with a raw item
(raw_item_id as a foreign
key)[\[4\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L30-L35).
Key fields might include the text body, content type (e.g. “text”,
“transcript”), language, duration (for media), and extraction timestamp.
This stage represents the **normalized, clean content** extracted from
the raw source (e.g. parsed HTML text or transcribed audio).  
- *📌* *Schema simplification:* *Ensure there’s a clear link from*
`raw_items` *to* `contents` *(e.g. a* `raw_item_id` *FK in* `contents`*,
as in the current schema). Using the name* `raw_item_id` *(instead of a
generic* `discovery_id`*) in the* `contents` *table makes the
relationship obvious.*

## 3. Processing Stage: **Stories & Clusters**

**Tables:** `stories`, `story_clusters` (could simply be called
`clusters`).  
- **Stories:** Represents a **processed content item** ready for users.
Each story links to the content (content_id
FK)[\[5\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L340-L344)
and includes additional metadata like title, summary, kind (article,
video, etc.), canonical URL, and timestamps. Essentially, if a content
record is the raw text, the **story is the enriched representation**
(with maybe some NLP processing or summarization applied). In practice,
there is typically a 1–1 relationship between content and
story[\[6\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L106).  
- *💡* *Possible simplification:* *Since* `contents` *and* `stories`
*are 1:1 in the current
design[\[6\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L106),
you could merge them into a single “Document” table to simplify.
However, keeping them separate can be useful for pipeline clarity and
de-duplication. For instance, if two raw items yield identical content,
you might insert one content/story and have others reference the same
story instead of duplicating
records[\[7\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L210-L219).*  
- **Story Clusters:** Groups related stories (e.g. near-duplicate or
same-topic stories). A cluster has a stable `cluster_key` and may
designate a primary story representative. Each cluster can have many
stories[\[8\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L100-L102)[\[9\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L340-L346).
This helps organize content by topic or de-dup content across sources.
(For readability, naming it just `clusters` is fine, since it already
lives in a context with stories. The schema currently uses
`story_clusters`, which is also clear.)

## 4. Analysis Stage: **Embeddings & Overlays**

**Tables:** `story_embeddings`, `story_overlays`.  
- **Story Embeddings:** Stores the **vector embedding** for each story’s
content (for semantic search or similarity). Each record links to a
story (story_id PK/FK) and contains the embedding vector (e.g. 1536-dim)
and model info. By linking on story, it directly ties to the text
content that was
embedded[\[5\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L340-L344).
*(For clarity, ensure the table name reflects its purpose;*
`story_embeddings` *is fine, or you could call it* `content_embeddings`
*if you merged stories/contents.)*  
- **Story Overlays:** Stores additional **LLM-generated analysis** for a
story – e.g. “why it matters” summaries, confidence scores, citation
data, etc. Each overlays record is identified by story_id. This table
represents AI-generated **insights layered on the story**. Key fields
could include a summary (“why_it_matters”), a JSON of citation links, a
confidence score, and an analysis status.  
- Both embeddings and overlays are **derived from stories** during
analysis jobs (LLM or embedding service). In the pipeline, once a story
is created, an async job can generate an embedding and overlay for
it[\[10\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L260-L265).  
- *For better readability:* Keep these analysis outputs clearly named
with the `story_` prefix (as they are) so it’s obvious they depend on
the story. The schema already indicates a story has many of these
derived
records[\[11\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L101-L106).

## 5. User Annotation Stage: **Highlights & References**

**Tables:** `highlights`, `highlight_references`, `highlight_tags`.  
- **Highlights:** Represents snippets or notes extracted from a story’s
content (either auto-generated insights or user-created highlights). A
highlight links to the related story (story_id) and optionally to a team
(for team-specific highlights vs global). Fields include the kind/type
(insight, quote, action, question), the text quote or summary, time
offsets (for video/audio content), a confidence score if applicable,
etc. Highlights can be **generated by the system or created by users**
during reading.  
- **Highlight References:** Since highlights often refer to specific
parts of the content, this table links a highlight to the exact source
segment – e.g. a reference to a `story_turn` (for a specific speaker
turn in a transcript) or a `chapter`. It may also store a source URL if
the highlight came from an external context. This **anchors highlights
to the original content** (text span or timestamp).  
- **Highlight Tags:** Allows tagging highlights with keywords. Each tag
record links to a highlight and stores a tag string. (This is separate
from story tags; these tags categorize individual highlights.)

*These tables enable users to interact with content. For example, when a
user highlights a passage, a new* `highlight` *is created referencing
the story and the content
span[\[12\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L308-L315).
The design here is already fairly clear – just ensure naming is
consistent (e.g., using* `highlight_references` *instead of something
generic).*

## 6. Consumption Stage: **Team States & Notes**

**Tables:** `team_story_states`, `team_highlight_states`,
`story_notes`.  
- **Team Story States:** Per-team status for stories (whether a story is
unread, read, archived for that team). It also tracks if the story is
pinned, a rating, and last viewed timestamp. This allows each team to
manage their view of the content (e.g. pin important stories, mark as
read).  
- **Team Highlight States:** Similar concept for highlights – whether a
highlight is active or archived for a team, and who pinned it. This
helps teams curate highlights (e.g. pin key insights for the team)
without altering the underlying highlight data.  
- **Story Notes:** Free-form notes that team members can attach to a
story. Each note is tied to a story, team, and user, with a visibility
setting (team-wide or personal). This provides a place for additional
commentary on a story.

*These tables make the schema multi-tenant and collaborative. For better
readability, the naming is already descriptive (each is clearly prefixed
with* `team_` *or* `story_` *and suffixed with* `state` *or* `notes`*).
Just document their purpose as above so it’s clear how they relate to
stories and highlights.*

## 7. Playbooks & Workflow Stage

**Tables:** `playbook_templates`, `playbooks`, `playbook_steps`,
`playbook_step_highlights`, `playbook_outputs`.  
- **Playbook Templates:** Define reusable frameworks (sequences of
steps) for workflows (e.g. a sales playbook or research workflow).
Contains metadata like title, description, target role, default channel,
etc., and who created it.  
- **Playbooks:** An instance of a playbook template launched by a team
(optionally linked to a specific story, customer, or goal). Tracks the
status (draft, active, published, etc.), associated story or customer,
and creation info.  
- **Playbook Steps:** The concrete steps of a playbook instance. Each
step may reference a template step definition, an assigned user, status
(pending, completed, etc.), content (e.g. notes or output of that step),
and completion timestamp. `position` defines the order.  
- **Playbook Step Highlights:** Join table linking highlights to
playbook steps (if a step involves discussing or using certain
highlights). This allows embedding story insights directly into a
playbook workflow.  
- **Playbook Outputs:** Records outputs or deliverables produced by a
playbook (e.g. a link to an external document, or generated content). It
stores the playbook ID, type of output, a URL if applicable, and any
metadata.

*These tables support guided workflows using the content. They are
separate from the core content pipeline, but their schema is already
organized with clear prefixes (*`playbook_*`*). To improve readability,
ensure that the relationships (template → playbook → steps, etc.) are
well-documented.*

## 8. Assistant (Chat) Stage

**Tables:** `assistant_threads`, `assistant_messages`,
`assistant_thread_sources`, `message_source_links`.  
- **Assistant Threads:** Represents a Q&A or chat session (thread)
within a team, often tied to content. Each thread can optionally link to
a story, playbook, or goal (if the conversation is about a specific
item). It has a status (active, resolved, archived), a topic, and tracks
who started it and when.  
- **Assistant Messages:** The messages within a thread. Each message has
a role (user, assistant, or system), the message body, and metadata
(e.g. tokens, response time). Messages may optionally link to a sender
user (for user messages) while assistant/system messages have no user.  
- **Assistant Thread Sources:** Links content pieces into an assistant
thread context. For example, if a user brings in a particular highlight
or story turn as context for the AI assistant, this table records that
(thread_id, plus either a highlight_id or turn_id). It helps the
assistant ground its answers on specific sources.  
- **Message Source Links:** After the assistant answers, this table can
link an assistant message to the specific highlight or story turn that
supports it, along with a confidence score. Essentially, it’s a citation
system for the AI’s responses (so users can see which highlight or
content segment backs a given assistant message).

*The assistant tables enable an AI helper that uses the content. The
schema here is already fairly clear, with names indicating their usage.
Just ensure foreign keys and their purpose are clearly noted (e.g. a
thread can have many messages; a message can have many source links,
etc.).*

## 9. Activity Log and Miscellaneous

**Tables:** `activities`, plus **Billing** (`products`, `prices`,
`subscriptions`) and **Ops** (`platform_quota`, `source_health`,
`job_metrics`).  
- **Activities:** A unified activity log for noteworthy events (story
published, highlight created, playbook published, subscription changes,
etc.). Each row can reference various entities (story, highlight,
playbook, etc.) and has an actor (user) and visibility (team, personal,
system). This is useful for building an activity feed.  
- **Billing Tables:** These track Stripe products, prices, and team
subscriptions. They are mostly standard for a SaaS app. For readability,
they’re separate from the content pipeline schema – you might document
them in a **Billing** section to avoid mixing with content tables.  
- **Operational Tables:** E.g. `platform_quota` for API usage quotas,
`source_health` for monitoring source sync status (ok/warn/error with
timestamps), and `job_metrics` for tracking background job counts. These
support monitoring and should be documented as such, separate from the
core product logic.

------------------------------------------------------------------------

## Key Schema Changes for Clarity

Based on the above, here are the main changes we’d make to improve
readability and alignment with the data pipeline:

- **Rename confusing tables to pipeline terms:** For example, rename
  `discoveries` → `raw_items` to clearly indicate these are newly
  discovered content items awaiting
  processing[\[13\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L8-L11).
  This matches the terminology in our design docs and makes the
  ingestion stage obvious. Likewise, using `raw_item_id` as the foreign
  key in `contents` (instead of a generic name) clarifies that
  relationship.
- **Emphasize one-to-one pipeline links:** Document or enforce that each
  raw item yields one content, and each content yields one
  story[\[6\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L106).
  In the schema, this is already implied by one-to-one relations (e.g.
  unique indexes on `raw_item_id` in `contents`, and `content_id` in
  `stories`). Making these constraints explicit (and maybe combining
  tables if one-to-one is always true) can simplify understanding. For
  instance, a **“Content (Story) ID”** could serve as a single
  identifier for the content piece through its lifecycle.
- **Use consistent naming conventions:** The schema is easier to read if
  naming reflects hierarchy. The current design is good in that regard
  (using prefixes like `story_`, `team_`, `playbook_`, etc.). We would
  maintain that, and ensure columns are named intuitively (e.g.
  `createdAt` vs `created_at` – stick to one style). Minor tweaks:
  consider `story_overlays` instead of `storyOverlays` for consistency
  (most tables use snake_case). Consistency helps new readers follow the
  design quickly.
- **Group related tables in documentation or code:** In your schema
  file, you already separate sections with comments. We’d go further by
  perhaps splitting the schema into multiple files or documentation
  sections: **Content Pipeline**, **Team/Collaboration**, **Playbooks**,
  **Assistant**, etc. This way, someone reading the schema can follow
  the content’s journey (from raw item to embedding) without being
  distracted by orthogonal sections like billing. In documentation, an
  ER diagram focusing on the content flow is helpful. For example,
  illustrating how **raw_items → contents → stories → (overlays,
  embeddings, clusters)**
  connect[\[14\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L339-L346)
  makes the design much easier to grasp.
- **Document the data flow with examples:** To match the schema to the
  pipeline, provide a brief narrative (like: “**Ingestion:** The system
  pulls sources and creates raw_items; **Extraction:** a engine fetches
  each raw_item’s content into contents; **Story Creation:** content is
  saved as a story for users to read; **Analysis:** an LLM generates a
  story_overlay and vector in
  story_embeddings[\[15\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L260-L264);
  **User Curation:** users highlight passages, which get saved in
  highlights referencing the story’s
  content[\[16\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L308-L314),
  etc.”). This ties the schema design to real usage, making it more
  intuitive.

By implementing the above changes – especially clarifying table
names/relationships and organizing the schema by pipeline stages – the
data model will be **much easier to read and reason about**. The goal is
that anyone looking at the schema or ER diagram can quickly follow the
content’s lifecycle from **raw input to embedded intelligence**, and see
how each part of the system (highlights, playbooks, assistant, etc.)
connects to that core pipeline. This alignment of schema design with the
data flow will improve both developer understanding and future
maintainability.[\[14\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L339-L346)[\[6\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L106)

------------------------------------------------------------------------

[\[1\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L102)
[\[2\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L116-L124)
[\[3\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L2-L10)
[\[4\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L30-L35)
[\[5\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L340-L344)
[\[6\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L99-L106)
[\[7\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L210-L219)
[\[8\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L100-L102)
[\[9\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L340-L346)
[\[10\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L260-L265)
[\[11\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L101-L106)
[\[12\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L308-L315)
[\[13\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L8-L11)
[\[14\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L339-L346)
[\[15\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L260-L264)
[\[16\]](https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md#L308-L314)
pipeline-diagrams.md

<https://github.com/joinvai/zeke/blob/b41e2acc41fef48ef8dd54118ca647f944cca26c/docs/plans/done/pipeline-diagrams.md>
