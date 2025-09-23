# K-Tree — Knowledge Trees for ZEKE

A shareable, visually striking “tree of knowledge” that maps stories into branches and leaves. The default tree auto‑grows from semantic connections (vector space). Users can build their own trees by hand, remix the defaults, take notes, and publish beautiful, viral snapshots.

## Objectives

- Create an iconic, viral visualization that people want to share.
- Help users learn by seeing relationships between stories and by writing alongside the map.
- Support both: (1) auto‑grown semantic trees and (2) hand‑crafted personal trees.
- Make creation delightful: zero friction to add, connect, label, and annotate.
- Keep performance smooth up to hundreds of visible nodes; progressively reveal larger sets.

## Non‑Goals (for initial release)

- Real‑time multi‑cursor co‑editing (single‑owner editing first, invite collaborators later).
- Arbitrary general graph editing (we enforce a tree+overlays pattern to keep clarity and style).
- Full mind‑mapping feature parity; K‑Tree is opinionated and stylized.

## Visual Style & Inspiration

- Botanical engraving aesthetic: parchment background, inked trunk/branches, oval “leaves” with titles.
- Branch curvature feels organic; subtle paper grain and drop shadows; muted, elegant palette.
- Typography: display serif for labels, crisp sans for small story titles; gentle ligatures.
- Micro‑animations: leaves grow in, branches ease with spring physics, hover parallax on paper texture.
- Export‑worthy: looks great as a poster, card, or social image at multiple aspect ratios.

## Core Concepts

- Tree: a named collection of nodes (stories, topics, notes) and edges arranged in a botanical layout.
- Node types:
  - Story: backed by a ZEKE story id; shows title, source, date, quick facts.
  - Topic: a user/LLM label that can group stories; optional description.
  - Note: a freeform thought or summary; can attach to a node or a branch.
- Edge types:
  - Semantic: auto‑derived from vector proximity; hidden by default in personal trees unless imported.
  - Manual: user‑drawn parent→child branch connections (the “true” tree structure).
  - Reference: light link between two leaves for cross‑references (shown as dotted veins on hover).
- Modes:
  - Explore: pan/zoom, expand/collapse branches, read popovers, follow references, share.
  - Build: add nodes, drag to connect, label branches, write notes; keyboard‑first where possible.
- Notebook: a right‑side notepad tied to selection. Notes can quote nodes, create backlinks, and drive labels.

## The Default System Tree (Auto)

High‑level recipe for generating the canonical, read‑only “System Tree of Knowledge” from all current stories:

1. Selection: include stories with published status and embeddings present; cap to a recent window or top‑N by importance.
2. Vector graph: use pgvector similarities to build a k‑NN graph; weights = cosine similarity.
3. Skeleton: compute a minimum spanning tree (MST) or “backbone” from the graph to enforce a tree shape.
4. Clustering: hierarchical clustering over embeddings or the k‑NN graph; prune depth for balance (3–5 levels visible by default).
5. Labeling: LLM‑generate concise branch labels from member titles/snippets; cache and allow manual curation.
6. Layout: radial botanical tree with trunk at bottom; order leaves to minimize crossings and overlap.
7. Reveal: progressive level‑of‑detail (LOD): trunk → main boughs → branches → leaves on zoom/expand.

Users can clone the System Tree as a starting template and then customize.

## Personal Trees (Hand‑Crafted)

- Start from scratch or “seed from” a query, a company page, or a selected set of stories.
- Drag stories from a drawer into the canvas; drag from node to branch to connect; auto‑snap to curvature.
- Use the Notebook to summarize a branch; convert a note to a Topic node that becomes a branch label.
- Import semantic suggestions: “Show related leaves” reveals ghost leaves near a branch; click to add.
- Share a read‑only public version with optional notes redaction; export an image/ PDF.

## UX Flow (Delightful Creation + Learning)

Explore Mode

- Zoom/pan with trackpad/mouse; double‑click to zoom to a branch; shift‑click to center.
- Click a leaf: popover with summary, sources, quick links; pin to keep open.
- Hover a branch label: show the Notebook note that generated it; click to open the right sidebar.
- Breadcrumb on top shows the path from trunk → bough → branch → leaf; click any segment to collapse others.

Build Mode

- Add: “+ Add” in the top left opens a story picker; drag stories into canvas.
- Connect: drag from a node handle to another branch or node; auto‑creates parent/child with organic path.
- Label: select a branch and type; or click “Suggest label” to pull an LLM summary of its children.
- Notes: right sidebar is a markdown notepad; typing `[[` suggests nodes to mention; mentions create backlinks.
- Ref links: select two leaves and press `R` to create a dotted cross‑reference.
- Arrange: hold space to move the entire branch; alt‑drag to reshape curvature (control points show briefly).
- Undo/redo: `⌘Z/⌘⇧Z`; autosave drafts; show save state.

Share & Export

- One‑click Social: generate an OG image and copied link; supports X/Bluesky/LinkedIn cards.
- Poster export: high‑res PNG/PDF at common print sizes; watermark + optional QR.
- Embed: responsive `<iframe>` embed with light interactivity; includes attribution.

## Visual System & Theming

- Paper: light, soft grain; color‑grade that adapts to dark mode (charcoal paper with silver ink).
- Ink strokes: variable width for trunk vs branches; subtle hatching on thicker segments.
- Leaves: ovals with gentle bevel; color accents by content kind (article, video, podcast, arXiv, HN, Reddit).
- Icons: tiny glyph per kind; source favicon on hover; verified/corroborated badges as leaf stamps.
- Animations: growth when adding nodes; a faint wind sway loop at rest (disabled on battery saver).

## Viral Mechanics

- Public gallery: featured, trending, and “Editor’s Picks”.
- Clone & remix: any public tree can be cloned with attribution.
- Share hooks: “What’s your branch on {topic}?” prefilled messages; OG images with bold labels.
- Discovery: hover cards in the gallery animate on move; click to open a minimal viewer; CTA to “Grow your own”.
- Creator credits: small profile plaque on trunk with avatar and @handle.

## Information Architecture & Routing

- Routes:
  - `/trees` — gallery + “New Tree” CTA.
  - `/trees/[id]` — view mode; public if published.
  - `/trees/[id]/edit` — build mode for owners/collaborators.
  - `/trees/system` — canonical default tree.
- URL state (nuqs): `mode`, `zoom`, `center`, `open` (id), `level`, `ghosts`, `notes`, `style`.
  - Example: `?mode=view&level=2&open=branch_42&style=botanical`.

## Data Model (Supabase)

Tables (conceptual; not SQL):

- knowledge_trees
  - id (uuid), owner_user_id (uuid), title, description, is_public (bool), published_at (timestamptz)
  - style (enum: botanical, radial, dendrogram), source_seed (jsonb), system_generated (bool)
  - created_at, updated_at, share_token (text, nullable)

- ktree_nodes
  - id (uuid), tree_id (uuid fk), type (enum: story|topic|note), story_id (uuid?), topic_label (text?), note_md (text?)
  - layout (jsonb: x,y,controlPoints,size,collapsed), meta (jsonb)
  - created_at, updated_at

- ktree_edges
  - id (uuid), tree_id (uuid fk), parent_id (uuid fk), child_id (uuid fk)
  - kind (enum: manual|semantic|reference), weight (float), hidden (bool default false)
  - created_at

- ktree_collaborators
  - tree_id, user_id, role (editor|viewer)

- ktree_notes
  - id, tree_id, node_id (nullable), body_md, created_by, created_at, updated_at, visibility (private|public)

- ktree_views (analytics)
  - tree_id, viewed_at, referrer, utm (jsonb), og_variant

Indexes: `tree_id` on nodes/edges/notes; composite `(tree_id, parent_id, child_id)` on edges; GIN on `meta` for search.

Permissions

- Row‑level security: owners and collaborators can edit; public reads for `is_public=true`.
- Notes default private; authors can mark public per note.
- Share token allows access to an unlisted read‑only view.

## Algorithms (Auto Tree Generation)

Input: stories with embeddings in `stories.embedding` (pgvector), min quality threshold, time window.

1. k‑NN graph: for each story, keep top‑k (e.g., k=10) neighbors by cosine similarity > τ.
2. Backbone: build MST over the k‑NN graph (Prim/Kruskal). Optionally compress very short edges.
3. Hierarchy: run hierarchical clustering (Ward or HDBSCAN → condensed tree) to define levels.
4. Labeling: for each cluster, select 5–15 canonical titles/snippets; LLM → 3–5 word label + emoji suggestion.
5. Layout: radial/botanical with force constraints to maintain organic spacing; avoid edge crossings.
6. LOD: precompute aggregate bounding boxes per level for progressive reveal and hit‑testing.
7. Cache: persist generated nodes/edges/labels for the System Tree; re‑gen nightly or incrementally.

Manual overlays: in personal trees, semantic suggestions appear as “ghost leaves” near branches; user accepts to convert to manual edges.

## Performance & Rendering

- Rendering tech: SVG up to ~500 visible nodes; switch to Canvas/WebGL (e.g., Pixi) for larger.
- Workers: run layout and heavy label packing in a Web Engine to keep UI responsive.
- Progressive load: render trunk and main boughs first; hydrate deeper levels on zoom/expand.
- Culling: viewport + scale culling for leaves; text fades into badges when too small.
- Interaction budget: maintain 60fps on M1 with 300 leaves; aim for <8ms frame time.

## Accessibility

- Keyboard: full navigation and editing (tab focus rings, arrow keys to traverse hierarchy, enter to open popover, space to pan, `F` to focus selected).
- Screen readers: tree/leaf roles with aria‑labels; provide an outline view that mirrors structure.
- High‑contrast mode and reduced‑motion respect system prefs.

## Security & Privacy

- Strip secrets from notes on share; offer “publish without notes” toggle.
- Public trees: only show public story metadata; respect user content visibility.
- Rate‑limit public gallery fetches; sanitize note markdown (allow safe subset).

## Analytics & Feedback Loops

- Track expands, zoom depth, node reads, share clicks, export usage.
- Use engagement to refine auto‑labels and branch ordering.
- Creator dashboard: views over time, top referrers, clones/remixes count.

## Implementation Plan (Phased)

V0 — Feels Magical (2–3 weeks)

- System Tree read‑only page: trunk + 2 levels, basic popovers, pretty styling.
- Personal Tree MVP: create, add stories, drag to connect, rename branches, simple notes panel.
- Sharing: OG image render + public link.

V1 — Creation Power (4–6 weeks)

- Ghost leaves (semantic suggestions), reference links, branch label suggestions via LLM.
- Export poster/PDF, gallery, clone/remix, collaborators (single‑owner + invited editors).
- Performance pass: workerized layout, LOD rendering, touch gestures.

V2 — Network Effects (ongoing)

- Embeds, trending, templates (Company/Topic/Timeframe), analytics dashboard, version history.
- Curated System Tree variants (by source/kind/company) and editorial highlights.

## Acceptance Criteria (First Public Release)

- Users can: create a tree, add at least 100 stories, connect into branches, label them, write notes, publish a beautiful page, and share a link that renders a compelling OG card.
- System Tree loads fast (<2s TTI on desktop broadband), scrolls/zooms smoothly, and makes the relationships obvious.
- The notepad is genuinely useful: mentions, backlinks, and “convert note → topic label”.
- Export produces a crisp, legible image suitable for social posts and small‑format printing.

## Open Questions

- Should we allow cycles for advanced users (true graphs) or keep pure trees with reference overlays?
- How do we gate LLM labeling costs on very large trees (batching, caching, rate limits)?
- Best default: bottom‑trunk botanical vs radial sunburst? Offer a toggle or pick one?
- How do we surface time in the layout (e.g., left‑to‑right chronology as a variant)?

## Risks & Mitigations

- Visual clutter at scale → progressive reveal, semantic clustering, collapse controls, and ghost suggestions.
- Export fidelity → dedicated high‑res render path (offscreen), font embedding, and text outlining.
- Performance instability → workerized layout, object pooling, and minimal DOM churn.

---

This spec aims to make K‑Tree a distinctive, share‑worthy way to explore and author knowledge on ZEKE — a blend of automatic insight and human curation, with an experience that feels crafted and expressive.

