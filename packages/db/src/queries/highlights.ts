import type { Database } from "@db/client";
import {
  type highlightCollaboratorRole,
  highlightCollaborators,
  type highlightKind,
  type highlightOrigin,
  highlightReferences,
  type highlightShareScope,
  highlightTags,
  highlights,
  stories,
  storyTurns,
  teamHighlightStates,
  teamStoryStates,
} from "@db/schema";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import {
  type HighlightReference,
  mapHighlightReference,
  numericToNumber,
} from "../utils/highlights";

type HighlightKind = (typeof highlightKind.enumValues)[number];
type HighlightOrigin = (typeof highlightOrigin.enumValues)[number];
type HighlightShareScope = (typeof highlightShareScope.enumValues)[number];
type HighlightCollaboratorRole =
  (typeof highlightCollaboratorRole.enumValues)[number];

export type HighlightFeedScope = "all" | "team" | "system";

export type HighlightFeedSort = "recent" | "relevant" | "confidence";

export type GetHighlightFeedParams = {
  teamId?: string | null;
  limit?: number;
  offset?: number;
  kind?: (typeof highlightKind.enumValues)[number] | null;
  tags?: string[];
  goalIds?: string[]; // Reserved for future personalization logic
  sortBy?: HighlightFeedSort;
  scope?: HighlightFeedScope;
};

export type HighlightFeedResult = {
  items: HighlightRecord[];
  total: number;
};

export type GetTrendingHighlightsParams = {
  timeframe: "day" | "week" | "month";
  limit?: number;
  teamId?: string | null;
  minConfidence?: number;
  scope?: HighlightFeedScope;
};

type HighlightBaseRow = {
  id: string;
  storyId: string;
  teamId: string | null;
  createdBy: string;
  chapterId: string | null;
  kind: HighlightKind;
  origin: HighlightOrigin;
  title: string | null;
  summary: string | null;
  quote: string | null;
  startSeconds: number | string | null;
  endSeconds: number | string | null;
  confidence: number | string | null;
  isGenerated: boolean;
  metadata: Record<string, unknown> | null;
  originMetadata: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type HighlightCollaboratorRecord = {
  id: string;
  highlightId: string;
  userId: string;
  role: HighlightCollaboratorRole;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TeamHighlightStateRecord = {
  id: string;
  highlightId: string;
  teamId: string;
  state: string | null;
  pinnedBy: string | null;
  sharedScope: HighlightShareScope;
  sharedBy: string | null;
  sharedAt: string | null;
  updatedAt: string | null;
};

export type HighlightRecord = {
  id: string;
  storyId: string;
  teamId: string | null;
  createdBy: string;
  chapterId: string | null;
  kind: HighlightKind;
  origin: HighlightOrigin;
  title: string | null;
  summary: string | null;
  quote: string | null;
  startSeconds: number | null;
  endSeconds: number | null;
  confidence: number | null;
  isGenerated: boolean;
  metadata: Record<string, unknown> | null;
  originMetadata: Record<string, unknown> | null;
  createdAt: string | null;
  updatedAt: string | null;
  tags: string[];
  references: HighlightReference[];
  collaborators: HighlightCollaboratorRecord[];
  state: TeamHighlightStateRecord | null;
};

export type GetStoryHighlightsParams = {
  storyId: string;
  teamId?: string | null;
  includeGlobal?: boolean;
  scope?: HighlightFeedScope;
};

export type GetHighlightByIdParams = {
  highlightId: string;
  teamId?: string | null;
};

export type CreateHighlightParams = {
  storyId: string;
  teamId: string;
  createdBy: string;
  chapterId?: string | null;
  kind?: HighlightKind;
  title?: string | null;
  summary?: string | null;
  quote?: string | null;
  startSeconds?: number | null;
  endSeconds?: number | null;
  turnIds?: string[];
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  origin?: HighlightOrigin;
  originMetadata?: Record<string, unknown> | null;
};

export type UpdateHighlightParams = {
  highlightId: string;
  teamId: string;
  title?: string | null;
  summary?: string | null;
  quote?: string | null;
  startSeconds?: number | null;
  endSeconds?: number | null;
  turnIds?: string[];
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  originMetadata?: Record<string, unknown> | null;
};

export type DeleteHighlightParams = {
  highlightId: string;
  teamId: string;
};

export type UpsertTeamHighlightStateParams = {
  highlightId: string;
  teamId: string;
  state?: string;
  pinnedBy?: string | null;
};

export type ShareHighlightParams = {
  highlightId: string;
  teamId: string;
  sharedBy: string;
  scope: HighlightShareScope;
  collaborators?: Array<{
    userId: string;
    role?: HighlightCollaboratorRole;
  }>;
};

export type RevokeHighlightShareParams = {
  highlightId: string;
  teamId: string;
  revokedBy: string;
};

const highlightSelection = {
  id: highlights.id,
  storyId: highlights.story_id,
  teamId: highlights.team_id,
  createdBy: highlights.created_by,
  chapterId: highlights.chapter_id,
  kind: highlights.kind,
  origin: highlights.origin,
  title: highlights.title,
  summary: highlights.summary,
  quote: highlights.quote,
  startSeconds: highlights.start_seconds,
  endSeconds: highlights.end_seconds,
  confidence: highlights.confidence,
  isGenerated: highlights.is_generated,
  metadata: highlights.metadata,
  originMetadata: highlights.origin_metadata,
  createdAt: highlights.created_at,
  updatedAt: highlights.updated_at,
};

function mapBaseHighlight(row: HighlightBaseRow): HighlightRecord {
  return {
    id: row.id,
    storyId: row.storyId,
    teamId: row.teamId,
    createdBy: row.createdBy,
    chapterId: row.chapterId,
    kind: row.kind,
    origin: row.origin,
    title: row.title,
    summary: row.summary,
    quote: row.quote,
    startSeconds: numericToNumber(row.startSeconds),
    endSeconds: numericToNumber(row.endSeconds),
    confidence: numericToNumber(row.confidence),
    isGenerated: row.isGenerated,
    metadata: row.metadata ?? null,
    originMetadata: row.originMetadata ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: [],
    references: [],
    collaborators: [],
    state: null,
  };
}

async function hydrateHighlights(
  db: Database,
  rows: HighlightBaseRow[],
  teamId?: string | null,
): Promise<HighlightRecord[]> {
  if (rows.length === 0) {
    return [];
  }

  const map = new Map<string, HighlightRecord>();
  const highlightIds: string[] = [];

  for (const row of rows) {
    const record = mapBaseHighlight(row);
    map.set(record.id, record);
    highlightIds.push(record.id);
  }

  if (teamId) {
    const stateRows = await db
      .select({
        id: teamHighlightStates.id,
        highlightId: teamHighlightStates.highlight_id,
        teamId: teamHighlightStates.team_id,
        state: teamHighlightStates.state,
        pinnedBy: teamHighlightStates.pinned_by,
        sharedScope: teamHighlightStates.shared_scope,
        sharedBy: teamHighlightStates.shared_by,
        sharedAt: teamHighlightStates.shared_at,
        updatedAt: teamHighlightStates.updated_at,
      })
      .from(teamHighlightStates)
      .where(
        and(
          eq(teamHighlightStates.team_id, teamId),
          inArray(teamHighlightStates.highlight_id, highlightIds),
        ),
      );

    for (const state of stateRows) {
      const record = map.get(state.highlightId);
      if (record) {
        record.state = {
          id: state.id,
          highlightId: state.highlightId,
          teamId: state.teamId,
          state: state.state,
          pinnedBy: state.pinnedBy,
          sharedScope: state.sharedScope,
          sharedBy: state.sharedBy,
          sharedAt: state.sharedAt,
          updatedAt: state.updatedAt,
        };
      }
    }
  }

  const tagRows = await db
    .select({
      highlightId: highlightTags.highlight_id,
      tag: highlightTags.tag,
    })
    .from(highlightTags)
    .where(inArray(highlightTags.highlight_id, highlightIds));

  for (const tag of tagRows) {
    const record = map.get(tag.highlightId);
    if (record) {
      record.tags.push(tag.tag);
    }
  }

  const referenceRows = await db
    .select({
      referenceId: highlightReferences.id,
      highlightId: highlightReferences.highlight_id,
      turnId: highlightReferences.turn_id,
      sourceUrl: highlightReferences.source_url,
      storyId: storyTurns.story_id,
      chapterId: storyTurns.chapter_id,
      speaker: storyTurns.speaker,
      content: storyTurns.content,
      startSeconds: storyTurns.start_seconds,
      endSeconds: storyTurns.end_seconds,
    })
    .from(highlightReferences)
    .leftJoin(storyTurns, eq(storyTurns.id, highlightReferences.turn_id))
    .where(inArray(highlightReferences.highlight_id, highlightIds))
    .orderBy(asc(highlightReferences.id));

  for (const reference of referenceRows) {
    const record = map.get(reference.highlightId);
    if (record) {
      record.references.push(mapHighlightReference(reference));
    }
  }

  const collaboratorRows = await db
    .select({
      id: highlightCollaborators.id,
      highlightId: highlightCollaborators.highlight_id,
      userId: highlightCollaborators.user_id,
      role: highlightCollaborators.role,
      createdAt: highlightCollaborators.created_at,
      updatedAt: highlightCollaborators.updated_at,
    })
    .from(highlightCollaborators)
    .where(inArray(highlightCollaborators.highlight_id, highlightIds));

  for (const collaborator of collaboratorRows) {
    const record = map.get(collaborator.highlightId);
    if (record) {
      record.collaborators.push({
        id: collaborator.id,
        highlightId: collaborator.highlightId,
        userId: collaborator.userId,
        role: collaborator.role,
        createdAt: collaborator.createdAt,
        updatedAt: collaborator.updatedAt,
      });
    }
  }

  return Array.from(map.values()).map((record) => {
    record.tags.sort();
    return record;
  });
}

const combineConditions = (conditions: SQL[]): SQL | undefined => {
  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
};

export async function getHighlightFeed(
  db: Database,
  params: GetHighlightFeedParams = {},
): Promise<HighlightFeedResult> {
  const {
    teamId = null,
    limit = 20,
    offset = 0,
    kind = null,
    tags,
    sortBy = "recent",
    scope = "all",
  } = params;

  const effectiveScope: HighlightFeedScope = (() => {
    if (!teamId) {
      return scope === "team" ? "team" : "system";
    }
    return scope;
  })();

  const baseConditions: SQL[] = [];

  switch (effectiveScope) {
    case "team": {
      if (teamId) {
        baseConditions.push(eq(highlights.team_id, teamId));
      } else {
        baseConditions.push(sql`false`);
      }
      break;
    }
    case "system": {
      baseConditions.push(isNull(highlights.team_id));
      break;
    }
    case "all":
    default: {
      if (teamId) {
        baseConditions.push(
          or(eq(highlights.team_id, teamId), isNull(highlights.team_id)),
        );
      } else {
        baseConditions.push(isNull(highlights.team_id));
      }
      break;
    }
  }

  if (kind) {
    baseConditions.push(eq(highlights.kind, kind));
  }

  const orderExpressions = (() => {
    switch (sortBy) {
      case "confidence":
      case "relevant":
        return [desc(highlights.confidence), desc(highlights.created_at)];
      default:
        return [desc(highlights.created_at)];
    }
  })();

  const idsConditions = [...baseConditions];

  if (tags?.length) {
    idsConditions.push(inArray(highlightTags.tag, tags));
  }

  const whereForIds = combineConditions(idsConditions);

  let idsQuery = db
    .select({ id: highlights.id })
    .from(highlights);

  if (tags?.length) {
    idsQuery = idsQuery.innerJoin(
      highlightTags,
      eq(highlightTags.highlight_id, highlights.id),
    );
  }

  if (whereForIds) {
    idsQuery = idsQuery.where(whereForIds);
  }

  if (tags?.length) {
    idsQuery = idsQuery.groupBy(highlights.id);
  }

  if (orderExpressions.length > 0) {
    idsQuery = idsQuery.orderBy(...orderExpressions);
  }

  const allIds = await idsQuery;
  const total = allIds.length;

  if (total === 0) {
    return { items: [], total: 0 };
  }

  const pagedIds = allIds
    .slice(offset, offset + limit)
    .map((row) => row.id);

  if (pagedIds.length === 0) {
    return { items: [], total };
  }

  let highlightsQuery = db
    .select(highlightSelection)
    .from(highlights)
    .where(inArray(highlights.id, pagedIds));

  if (orderExpressions.length > 0) {
    highlightsQuery = highlightsQuery.orderBy(...orderExpressions);
  }

  const rows = (await highlightsQuery) as HighlightBaseRow[];
  const hydrated = await hydrateHighlights(db, rows, teamId ?? null);

  return { items: hydrated, total };
}

export async function getTrendingHighlights(
  db: Database,
  params: GetTrendingHighlightsParams,
): Promise<HighlightRecord[]> {
  const {
    timeframe,
    limit = 10,
    teamId = null,
    minConfidence = 0.7,
    scope = teamId ? "all" : "system",
  } = params;

  const timeframeMs = (() => {
    switch (timeframe) {
      case "day":
        return 24 * 60 * 60 * 1000;
      case "month":
        return 30 * 24 * 60 * 60 * 1000;
      case "week":
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  })();

  const since = new Date(Date.now() - timeframeMs);

  const conditions: SQL[] = [
    gte(highlights.created_at, since),
    gt(highlights.confidence, minConfidence),
  ];

  switch (scope) {
    case "team": {
      if (teamId) {
        conditions.push(eq(highlights.team_id, teamId));
      } else {
        conditions.push(sql`false`);
      }
      break;
    }
    case "system": {
      conditions.push(isNull(highlights.team_id));
      break;
    }
    case "all":
    default: {
      if (teamId) {
        conditions.push(
          or(eq(highlights.team_id, teamId), isNull(highlights.team_id)),
        );
      } else {
        conditions.push(isNull(highlights.team_id));
      }
      break;
    }
  }

  const whereCondition = combineConditions(conditions);

  let query = db.select(highlightSelection).from(highlights);

  if (whereCondition) {
    query = query.where(whereCondition);
  }

  query = query.orderBy(
    desc(highlights.confidence),
    desc(highlights.created_at),
  );

  const rows = (await query.limit(limit)) as HighlightBaseRow[];

  if (rows.length === 0) {
    return [];
  }

  return hydrateHighlights(db, rows, teamId ?? null);
}

async function fetchHighlights(
  db: Database,
  filter: SQL | undefined,
): Promise<HighlightBaseRow[]> {
  let query = db.select(highlightSelection).from(highlights);

  if (filter) {
    query = query.where(filter);
  }

  return query.orderBy(
    desc(highlights.created_at),
    highlights.id,
  ) as unknown as Promise<HighlightBaseRow[]>;
}

export async function getStoryHighlights(
  db: Database,
  params: GetStoryHighlightsParams,
): Promise<HighlightRecord[]> {
  const includeGlobal = params.includeGlobal ?? true;
  const scope: HighlightFeedScope = (() => {
    if (params.scope) return params.scope;
    return includeGlobal ? "all" : "team";
  })();
  const conditions: SQL[] = [eq(highlights.story_id, params.storyId)];

  if (params.teamId) {
    switch (scope) {
      case "team":
        conditions.push(eq(highlights.team_id, params.teamId));
        break;
      case "system":
        conditions.push(isNull(highlights.team_id));
        break;
      case "all":
      default:
        conditions.push(
          or(eq(highlights.team_id, params.teamId), isNull(highlights.team_id)),
        );
        break;
    }
  } else {
    if (scope === "team") {
      return [];
    }
    conditions.push(isNull(highlights.team_id));
  }

  const filter = conditions.length === 1 ? conditions[0] : and(...conditions);
  const rows = await fetchHighlights(db, filter);
  return hydrateHighlights(db, rows, params.teamId ?? null);
}

export async function getHighlightById(
  db: Database,
  params: GetHighlightByIdParams,
): Promise<HighlightRecord | null> {
  const rows = await fetchHighlights(db, eq(highlights.id, params.highlightId));
  const [record] = await hydrateHighlights(db, rows, params.teamId ?? null);
  return record ?? null;
}

export async function createHighlight(
  db: Database,
  params: CreateHighlightParams,
): Promise<HighlightRecord | null> {
  const highlightId = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(highlights)
      .values({
        story_id: params.storyId,
        team_id: params.teamId,
        created_by: params.createdBy,
        chapter_id: params.chapterId ?? null,
        kind: params.kind ?? undefined,
        title: params.title ?? null,
        summary: params.summary ?? null,
        quote: params.quote ?? null,
        start_seconds: params.startSeconds ?? null,
        end_seconds: params.endSeconds ?? null,
        metadata: params.metadata ?? null,
        origin: params.origin ?? undefined,
        origin_metadata: params.originMetadata ?? null,
      })
      .returning({ id: highlights.id });

    if (!inserted) {
      throw new Error("Failed to create highlight");
    }

    const referenceTurnIds = Array.from(new Set(params.turnIds ?? []));
    if (referenceTurnIds.length > 0) {
      await tx.insert(highlightReferences).values(
        referenceTurnIds.map((turnId) => ({
          highlight_id: inserted.id,
          turn_id: turnId,
        })),
      );
    }

    const tags = Array.from(new Set(params.tags ?? []));
    if (tags.length > 0) {
      await tx.insert(highlightTags).values(
        tags.map((tag) => ({
          highlight_id: inserted.id,
          tag,
        })),
      );
    }

    await tx
      .insert(teamHighlightStates)
      .values({
        team_id: params.teamId,
        highlight_id: inserted.id,
        pinned_by: null,
      })
      .onConflictDoNothing({
        target: [teamHighlightStates.team_id, teamHighlightStates.highlight_id],
      });

    return inserted.id;
  });

  return getHighlightById(db, {
    highlightId,
    teamId: params.teamId,
  });
}

export async function updateHighlight(
  db: Database,
  params: UpdateHighlightParams,
): Promise<HighlightRecord | null> {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        highlightId: highlights.id,
        teamId: highlights.team_id,
      })
      .from(highlights)
      .where(eq(highlights.id, params.highlightId))
      .limit(1);

    if (!existing || existing.teamId !== params.teamId) {
      throw new Error("Highlight not found for team");
    }

    const updateData: Record<string, unknown> = { updated_at: sql`now()` };

    if (params.title !== undefined) updateData.title = params.title;
    if (params.summary !== undefined) updateData.summary = params.summary;
    if (params.quote !== undefined) updateData.quote = params.quote;
    if (params.startSeconds !== undefined)
      updateData.start_seconds = params.startSeconds ?? null;
    if (params.endSeconds !== undefined)
      updateData.end_seconds = params.endSeconds ?? null;
    if (params.metadata !== undefined)
      updateData.metadata = params.metadata ?? null;
    if (params.originMetadata !== undefined)
      updateData.origin_metadata = params.originMetadata ?? null;

    if (Object.keys(updateData).length > 0) {
      await tx
        .update(highlights)
        .set(updateData)
        .where(eq(highlights.id, params.highlightId));
    }

    if (params.turnIds) {
      await tx
        .delete(highlightReferences)
        .where(eq(highlightReferences.highlight_id, params.highlightId));

      const uniqueTurnIds = Array.from(new Set(params.turnIds));
      if (uniqueTurnIds.length > 0) {
        await tx.insert(highlightReferences).values(
          uniqueTurnIds.map((turnId) => ({
            highlight_id: params.highlightId,
            turn_id: turnId,
          })),
        );
      }
    }

    if (params.tags) {
      await tx
        .delete(highlightTags)
        .where(eq(highlightTags.highlight_id, params.highlightId));

      const tags = Array.from(new Set(params.tags));
      if (tags.length > 0) {
        await tx.insert(highlightTags).values(
          tags.map((tag) => ({
            highlight_id: params.highlightId,
            tag,
          })),
        );
      }
    }
  });

  return getHighlightById(db, {
    highlightId: params.highlightId,
    teamId: params.teamId,
  });
}

export async function deleteHighlight(
  db: Database,
  params: DeleteHighlightParams,
): Promise<{ id: string } | null> {
  const result = await db
    .delete(highlights)
    .where(
      and(
        eq(highlights.id, params.highlightId),
        eq(highlights.team_id, params.teamId),
      ),
    )
    .returning({ id: highlights.id });

  return result[0] ?? null;
}

export async function upsertTeamHighlightState(
  db: Database,
  params: UpsertTeamHighlightStateParams,
): Promise<TeamHighlightStateRecord | null> {
  const updateSet: Record<string, unknown> = {
    updated_at: sql`now()`,
  };

  if (params.state !== undefined) {
    updateSet.state = params.state;
  }

  if (params.pinnedBy !== undefined) {
    updateSet.pinned_by = params.pinnedBy ?? null;
  }

  const [row] = await db
    .insert(teamHighlightStates)
    .values({
      team_id: params.teamId,
      highlight_id: params.highlightId,
      state: params.state,
      pinned_by: params.pinnedBy ?? null,
    })
    .onConflictDoUpdate({
      target: [teamHighlightStates.team_id, teamHighlightStates.highlight_id],
      set: updateSet,
    })
    .returning({
      id: teamHighlightStates.id,
      highlightId: teamHighlightStates.highlight_id,
      teamId: teamHighlightStates.team_id,
      state: teamHighlightStates.state,
      pinnedBy: teamHighlightStates.pinned_by,
      sharedScope: teamHighlightStates.shared_scope,
      sharedBy: teamHighlightStates.shared_by,
      sharedAt: teamHighlightStates.shared_at,
      updatedAt: teamHighlightStates.updated_at,
    });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    highlightId: row.highlightId,
    teamId: row.teamId,
    state: row.state,
    pinnedBy: row.pinnedBy,
    sharedScope: row.sharedScope,
    sharedBy: row.sharedBy,
    sharedAt: row.sharedAt,
    updatedAt: row.updatedAt,
  };
}

export async function getPinnedHighlights(
  db: Database,
  teamId: string,
): Promise<HighlightRecord[]> {
  const pinned = await db
    .select({
      highlightId: teamHighlightStates.highlight_id,
    })
    .from(teamHighlightStates)
    .where(
      and(
        eq(teamHighlightStates.team_id, teamId),
        isNotNull(teamHighlightStates.pinned_by),
      ),
    );

  const highlightIds = pinned.map((row) => row.highlightId);
  if (highlightIds.length === 0) {
    return [];
  }

  const rows = await fetchHighlights(db, inArray(highlights.id, highlightIds));

  const records = await hydrateHighlights(db, rows, teamId);
  return records.sort((a, b) => {
    const aUpdated = a.state?.updatedAt ?? "";
    const bUpdated = b.state?.updatedAt ?? "";
    return aUpdated > bUpdated ? -1 : aUpdated < bUpdated ? 1 : 0;
  });
}

export async function shareHighlight(
  db: Database,
  params: ShareHighlightParams,
): Promise<HighlightRecord | null> {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ teamId: highlights.team_id })
      .from(highlights)
      .where(eq(highlights.id, params.highlightId))
      .limit(1);

    if (!existing || existing.teamId !== params.teamId) {
      throw new Error("Highlight not found for team");
    }

    await tx
      .insert(teamHighlightStates)
      .values({
        team_id: params.teamId,
        highlight_id: params.highlightId,
        shared_scope: params.scope,
        shared_by: params.sharedBy,
        shared_at: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [teamHighlightStates.team_id, teamHighlightStates.highlight_id],
        set: {
          shared_scope: params.scope,
          shared_by: params.sharedBy,
          shared_at: sql`now()`,
          updated_at: sql`now()`,
        },
      });

    if (params.collaborators) {
      await tx
        .delete(highlightCollaborators)
        .where(eq(highlightCollaborators.highlight_id, params.highlightId));

      const collaborators = params.collaborators.map((collaborator) => ({
        highlight_id: params.highlightId,
        user_id: collaborator.userId,
        role: collaborator.role ?? "viewer",
      }));

      if (collaborators.length > 0) {
        await tx.insert(highlightCollaborators).values(collaborators);
      }
    }
  });

  return getHighlightById(db, {
    highlightId: params.highlightId,
    teamId: params.teamId,
  });
}

export async function revokeHighlightShare(
  db: Database,
  params: RevokeHighlightShareParams,
): Promise<HighlightRecord | null> {
  await db.transaction(async (tx) => {
    await tx
      .update(teamHighlightStates)
      .set({
        shared_scope: "private",
        shared_by: params.revokedBy,
        shared_at: sql`now()`,
        updated_at: sql`now()`,
      })
      .where(
        and(
          eq(teamHighlightStates.team_id, params.teamId),
          eq(teamHighlightStates.highlight_id, params.highlightId),
        ),
      );

    await tx
      .delete(highlightCollaborators)
      .where(eq(highlightCollaborators.highlight_id, params.highlightId));
  });

  return getHighlightById(db, {
    highlightId: params.highlightId,
    teamId: params.teamId,
  });
}

export async function getSharedHighlights(
  db: Database,
  teamId: string,
): Promise<HighlightRecord[]> {
  const sharedStates = await db
    .select({ highlightId: teamHighlightStates.highlight_id })
    .from(teamHighlightStates)
    .where(
      and(
        eq(teamHighlightStates.team_id, teamId),
        inArray(teamHighlightStates.shared_scope, ["team", "public"]),
      ),
    );

  const highlightIds = sharedStates.map((row) => row.highlightId);
  if (highlightIds.length === 0) {
    return [];
  }

  const rows = await fetchHighlights(db, inArray(highlights.id, highlightIds));

  return hydrateHighlights(db, rows, teamId);
}

/**
 * Get prioritized highlights for team dashboard
 * Ordered by relevance_score DESC, then recency
 */
export async function getPrioritizedHighlights(
  db: Database,
  teamId: string,
  limit = 20,
): Promise<
  Array<{
    id: string;
    storyId: string;
    kind: string | null;
    title: string | null;
    summary: string | null;
    quote: string | null;
    confidence: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string | null;
    storyTitle: string | null;
    storyPublishedAt: string | null;
  }>
> {
  return db
    .select({
      id: highlights.id,
      storyId: highlights.story_id,
      kind: highlights.kind,
      title: highlights.title,
      summary: highlights.summary,
      quote: highlights.quote,
      confidence: highlights.confidence,
      metadata: highlights.metadata,
      createdAt: highlights.created_at,
      storyTitle: stories.title,
      storyPublishedAt: stories.published_at,
    })
    .from(highlights)
    .innerJoin(stories, eq(highlights.story_id, stories.id))
    .innerJoin(teamStoryStates, eq(teamStoryStates.story_id, stories.id))
    .where(eq(teamStoryStates.team_id, teamId))
    .orderBy(
      sql`(${highlights.metadata}->>'relevance_score')::float DESC NULLS LAST`,
      desc(stories.published_at),
    )
    .limit(limit);
}

/**
 * Get highlights by kind with relevance filtering
 */
export async function getHighlightsByKind(
  db: Database,
  teamId: string,
  kind: (typeof highlightKind.enumValues)[number],
  minRelevance = 0.7,
  limit = 10,
): Promise<
  Array<{
    id: string;
    storyId: string;
    kind: string | null;
    title: string | null;
    summary: string | null;
    quote: string | null;
    confidence: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string | null;
    storyTitle: string | null;
    storyPublishedAt: string | null;
  }>
> {
  return db
    .select({
      id: highlights.id,
      storyId: highlights.story_id,
      kind: highlights.kind,
      title: highlights.title,
      summary: highlights.summary,
      quote: highlights.quote,
      confidence: highlights.confidence,
      metadata: highlights.metadata,
      createdAt: highlights.created_at,
      storyTitle: stories.title,
      storyPublishedAt: stories.published_at,
    })
    .from(highlights)
    .innerJoin(stories, eq(highlights.story_id, stories.id))
    .innerJoin(teamStoryStates, eq(teamStoryStates.story_id, stories.id))
    .where(
      and(
        eq(teamStoryStates.team_id, teamId),
        eq(highlights.kind, kind),
        sql`(${highlights.metadata}->>'relevance_score')::float >= ${minRelevance}`,
      ),
    )
    .orderBy(sql`(${highlights.metadata}->>'relevance_score')::float DESC`)
    .limit(limit);
}
