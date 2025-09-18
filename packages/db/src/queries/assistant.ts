import type { Database } from "@db/client";
import {
  assistantMessages,
  assistantThreadSources,
  assistantThreads,
  type highlightOrigin,
  highlights,
  type messageRole,
  messageSourceLinks,
  storyTurns,
  type threadStatus,
} from "@db/schema";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

type ThreadStatus = (typeof threadStatus.enumValues)[number];
type MessageRole = (typeof messageRole.enumValues)[number];

type HighlightOrigin = (typeof highlightOrigin.enumValues)[number];

export type AssistantThreadRecord = {
  id: string;
  teamId: string;
  storyId: string | null;
  playbookId: string | null;
  goalId: string | null;
  createdBy: string;
  topic: string | null;
  status: ThreadStatus;
  startedAt: string | null;
};

export type AssistantThreadSourceRecord = {
  id: string;
  threadId: string;
  highlightId: string | null;
  turnId: string | null;
  addedBy: string;
  position: number;
  addedAt: string | null;
  highlight?: {
    id: string;
    storyId: string;
    teamId: string | null;
    title: string | null;
    summary: string | null;
    quote: string | null;
    origin: HighlightOrigin;
    createdAt: string | null;
  };
  turn?: {
    id: string;
    storyId: string;
    chapterId: string | null;
    speaker: string | null;
    content: string | null;
    startSeconds: number | null;
    endSeconds: number | null;
  };
};

export type AssistantMessageSourceLink = {
  id: string;
  messageId: string;
  highlightId: string | null;
  turnId: string | null;
  confidence: number | null;
  highlight?: {
    id: string;
    storyId: string;
    teamId: string | null;
    title: string | null;
    summary: string | null;
    quote: string | null;
    origin: HighlightOrigin;
    createdAt: string | null;
  };
  turn?: {
    id: string;
    storyId: string;
    chapterId: string | null;
    speaker: string | null;
    content: string | null;
    startSeconds: number | null;
    endSeconds: number | null;
  };
};

export type AssistantMessageRecord = {
  id: string;
  threadId: string;
  senderId: string | null;
  role: MessageRole;
  body: string;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
  sources: AssistantMessageSourceLink[];
};

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function mapThreadRow(row: {
  id: string;
  teamId: string;
  storyId: string | null;
  playbookId: string | null;
  goalId: string | null;
  createdBy: string;
  topic: string | null;
  status: ThreadStatus;
  startedAt: string | null;
}): AssistantThreadRecord {
  return {
    id: row.id,
    teamId: row.teamId,
    storyId: row.storyId,
    playbookId: row.playbookId,
    goalId: row.goalId,
    createdBy: row.createdBy,
    topic: row.topic,
    status: row.status,
    startedAt: row.startedAt ?? null,
  };
}

async function loadThreadSources(
  db: Database,
  threadId: string,
  options: { sourceIds?: string[] } = {},
): Promise<AssistantThreadSourceRecord[]> {
  const conditions: SQL[] = [eq(assistantThreadSources.thread_id, threadId)];
  if (options.sourceIds?.length) {
    conditions.push(inArray(assistantThreadSources.id, options.sourceIds));
  }

  const rows = await db
    .select({
      id: assistantThreadSources.id,
      threadId: assistantThreadSources.thread_id,
      highlightId: assistantThreadSources.highlight_id,
      turnId: assistantThreadSources.turn_id,
      addedBy: assistantThreadSources.added_by,
      position: assistantThreadSources.position,
      addedAt: assistantThreadSources.added_at,
      highlightStoryId: highlights.story_id,
      highlightTeamId: highlights.team_id,
      highlightTitle: highlights.title,
      highlightSummary: highlights.summary,
      highlightQuote: highlights.quote,
      highlightOrigin: highlights.origin,
      highlightCreatedAt: highlights.created_at,
      turnStoryId: storyTurns.story_id,
      turnChapterId: storyTurns.chapter_id,
      turnSpeaker: storyTurns.speaker,
      turnContent: storyTurns.content,
      turnStart: storyTurns.start_seconds,
      turnEnd: storyTurns.end_seconds,
    })
    .from(assistantThreadSources)
    .leftJoin(
      highlights,
      eq(highlights.id, assistantThreadSources.highlight_id),
    )
    .leftJoin(storyTurns, eq(storyTurns.id, assistantThreadSources.turn_id))
    .$if(conditions.length > 0, (qb) => qb.where(and(...conditions)))
    .orderBy(asc(assistantThreadSources.position), assistantThreadSources.id);

  return rows.map((row) => ({
    id: row.id,
    threadId: row.threadId,
    highlightId: row.highlightId,
    turnId: row.turnId,
    addedBy: row.addedBy,
    position: row.position,
    addedAt: row.addedAt,
    highlight: row.highlightId
      ? {
          id: row.highlightId,
          storyId: row.highlightStoryId!,
          teamId: row.highlightTeamId,
          title: row.highlightTitle,
          summary: row.highlightSummary,
          quote: row.highlightQuote,
          origin: row.highlightOrigin as HighlightOrigin,
          createdAt: row.highlightCreatedAt,
        }
      : undefined,
    turn: row.turnId
      ? {
          id: row.turnId,
          storyId: row.turnStoryId!,
          chapterId: row.turnChapterId,
          speaker: row.turnSpeaker,
          content: row.turnContent,
          startSeconds: parseNumeric(row.turnStart),
          endSeconds: parseNumeric(row.turnEnd),
        }
      : undefined,
  }));
}

async function loadMessageSources(
  db: Database,
  messageIds: string[],
): Promise<Map<string, AssistantMessageSourceLink[]>> {
  if (messageIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      id: messageSourceLinks.id,
      messageId: messageSourceLinks.message_id,
      highlightId: messageSourceLinks.highlight_id,
      turnId: messageSourceLinks.turn_id,
      confidence: messageSourceLinks.confidence,
      highlightStoryId: highlights.story_id,
      highlightTeamId: highlights.team_id,
      highlightTitle: highlights.title,
      highlightSummary: highlights.summary,
      highlightQuote: highlights.quote,
      highlightOrigin: highlights.origin,
      highlightCreatedAt: highlights.created_at,
      turnStoryId: storyTurns.story_id,
      turnChapterId: storyTurns.chapter_id,
      turnSpeaker: storyTurns.speaker,
      turnContent: storyTurns.content,
      turnStart: storyTurns.start_seconds,
      turnEnd: storyTurns.end_seconds,
    })
    .from(messageSourceLinks)
    .leftJoin(highlights, eq(highlights.id, messageSourceLinks.highlight_id))
    .leftJoin(storyTurns, eq(storyTurns.id, messageSourceLinks.turn_id))
    .where(inArray(messageSourceLinks.message_id, messageIds))
    .orderBy(messageSourceLinks.message_id, messageSourceLinks.id);

  return rows.reduce<Map<string, AssistantMessageSourceLink[]>>((acc, row) => {
    const list = acc.get(row.messageId) ?? [];
    list.push({
      id: row.id,
      messageId: row.messageId,
      highlightId: row.highlightId,
      turnId: row.turnId,
      confidence: parseNumeric(row.confidence),
      highlight: row.highlightId
        ? {
            id: row.highlightId,
            storyId: row.highlightStoryId!,
            teamId: row.highlightTeamId,
            title: row.highlightTitle,
            summary: row.highlightSummary,
            quote: row.highlightQuote,
            origin: row.highlightOrigin as HighlightOrigin,
            createdAt: row.highlightCreatedAt!,
          }
        : undefined,
      turn: row.turnId
        ? {
            id: row.turnId,
            storyId: row.turnStoryId!,
            chapterId: row.turnChapterId,
            speaker: row.turnSpeaker,
            content: row.turnContent,
            startSeconds: parseNumeric(row.turnStart),
            endSeconds: parseNumeric(row.turnEnd),
          }
        : undefined,
    });
    acc.set(row.messageId, list);
    return acc;
  }, new Map());
}

/**
 * Find the active assistant thread for a context or create a new one.
 */
export async function getOrCreateAssistantThread(
  db: Database,
  params: {
    teamId: string;
    storyId?: string | null;
    playbookId?: string | null;
    goalId?: string | null;
    createdBy: string;
    topic?: string | null;
  },
): Promise<AssistantThreadRecord> {
  const conditions: SQL[] = [
    eq(assistantThreads.team_id, params.teamId),
    eq(assistantThreads.status, "active"),
  ];

  if (params.storyId !== undefined) {
    conditions.push(
      params.storyId === null
        ? sql`${assistantThreads.story_id} is null`
        : eq(assistantThreads.story_id, params.storyId),
    );
  }

  if (params.playbookId !== undefined) {
    conditions.push(
      params.playbookId === null
        ? sql`${assistantThreads.playbook_id} is null`
        : eq(assistantThreads.playbook_id, params.playbookId),
    );
  }

  if (params.goalId !== undefined) {
    conditions.push(
      params.goalId === null
        ? sql`${assistantThreads.goal_id} is null`
        : eq(assistantThreads.goal_id, params.goalId),
    );
  }

  let selectExisting = db
    .select({
      id: assistantThreads.id,
      teamId: assistantThreads.team_id,
      storyId: assistantThreads.story_id,
      playbookId: assistantThreads.playbook_id,
      goalId: assistantThreads.goal_id,
      createdBy: assistantThreads.created_by,
      topic: assistantThreads.topic,
      status: assistantThreads.status,
      startedAt: assistantThreads.started_at,
    })
    .from(assistantThreads);

  if (conditions.length > 0) {
    selectExisting = selectExisting.where(and(...conditions));
  }

  const existing = await selectExisting
    .orderBy(desc(assistantThreads.started_at))
    .limit(1);

  const current = existing[0];
  if (current) {
    return mapThreadRow(current);
  }

  const [created] = await db
    .insert(assistantThreads)
    .values({
      team_id: params.teamId,
      story_id: params.storyId ?? null,
      playbook_id: params.playbookId ?? null,
      goal_id: params.goalId ?? null,
      created_by: params.createdBy,
      topic: params.topic ?? null,
      status: "active",
    })
    .returning({
      id: assistantThreads.id,
      teamId: assistantThreads.team_id,
      storyId: assistantThreads.story_id,
      playbookId: assistantThreads.playbook_id,
      goalId: assistantThreads.goal_id,
      createdBy: assistantThreads.created_by,
      topic: assistantThreads.topic,
      status: assistantThreads.status,
      startedAt: assistantThreads.started_at,
    });

  if (!created) {
    throw new Error("Unable to create assistant thread");
  }

  return mapThreadRow(created);
}

/**
 * Fetch ordered chat messages for a thread along with their source citations.
 */
export async function getAssistantMessages(
  db: Database,
  params: { threadId: string; limit?: number; before?: string | null },
): Promise<AssistantMessageRecord[]> {
  const { limit = 50 } = params;

  const conditions: SQL[] = [eq(assistantMessages.thread_id, params.threadId)];

  if (params.before) {
    conditions.push(lt(assistantMessages.created_at, params.before));
  }

  let query = db
    .select({
      id: assistantMessages.id,
      threadId: assistantMessages.thread_id,
      senderId: assistantMessages.sender_id,
      role: assistantMessages.role,
      body: assistantMessages.body,
      metadata: assistantMessages.metadata,
      createdAt: assistantMessages.created_at,
    })
    .from(assistantMessages);

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rows = await query
    .orderBy(asc(assistantMessages.created_at), assistantMessages.id)
    .limit(limit);

  const messageIds = rows.map((row) => row.id);
  const sourcesByMessage = await loadMessageSources(db, messageIds);

  return rows.map((row) => ({
    id: row.id,
    threadId: row.threadId,
    senderId: row.senderId,
    role: row.role as MessageRole,
    body: row.body,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt,
    sources: sourcesByMessage.get(row.id) ?? [],
  }));
}

/**
 * List highlight/turn tabs attached to an assistant thread.
 */
export async function getAssistantThreadSources(
  db: Database,
  threadId: string,
): Promise<AssistantThreadSourceRecord[]> {
  return loadThreadSources(db, threadId);
}

/**
 * Append a message to the thread.
 */
export async function createAssistantMessage(
  db: Database,
  params: {
    threadId: string;
    senderId?: string | null;
    role: MessageRole;
    body: string;
    metadata?: Record<string, unknown> | null;
  },
): Promise<AssistantMessageRecord> {
  const [row] = await db
    .insert(assistantMessages)
    .values({
      thread_id: params.threadId,
      sender_id: params.senderId ?? null,
      role: params.role,
      body: params.body,
      metadata: params.metadata ?? null,
    })
    .returning({
      id: assistantMessages.id,
      threadId: assistantMessages.thread_id,
      senderId: assistantMessages.sender_id,
      role: assistantMessages.role,
      body: assistantMessages.body,
      metadata: assistantMessages.metadata,
      createdAt: assistantMessages.created_at,
    });

  if (!row) {
    throw new Error("Unable to create assistant message");
  }

  return {
    id: row.id,
    threadId: row.threadId,
    senderId: row.senderId,
    role: row.role as MessageRole,
    body: row.body,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt,
    sources: [],
  };
}

/**
 * Attach a highlight or transcript turn to a thread for quick reference.
 */
export async function addAssistantThreadSource(
  db: Database,
  params: {
    threadId: string;
    highlightId?: string | null;
    turnId?: string | null;
    addedBy: string;
    position?: number | null;
  },
): Promise<AssistantThreadSourceRecord> {
  const nextPosition = await db
    .select({
      next: sql<number>`coalesce(max(${assistantThreadSources.position}) + 1, 0)`,
    })
    .from(assistantThreadSources)
    .where(eq(assistantThreadSources.thread_id, params.threadId))
    .then(([row]) => row?.next ?? 0);

  const [inserted] = await db
    .insert(assistantThreadSources)
    .values({
      thread_id: params.threadId,
      highlight_id: params.highlightId ?? null,
      turn_id: params.turnId ?? null,
      added_by: params.addedBy,
      position: params.position ?? nextPosition,
    })
    .returning({ id: assistantThreadSources.id });

  if (!inserted) {
    throw new Error("Failed to insert assistant thread source");
  }

  const [source] = await loadThreadSources(db, params.threadId, {
    sourceIds: [inserted.id],
  });

  if (!source) {
    throw new Error("Assistant thread source was created but not found");
  }

  return source;
}

/**
 * Remove a highlight/turn tab from the assistant thread.
 */
export async function removeAssistantThreadSource(
  db: Database,
  params: { threadSourceId: string; threadId: string },
): Promise<void> {
  await db
    .delete(assistantThreadSources)
    .where(
      and(
        eq(assistantThreadSources.id, params.threadSourceId),
        eq(assistantThreadSources.thread_id, params.threadId),
      ),
    );
}

/**
 * Replace the citations attached to a chat message.
 */
export async function linkMessageSources(
  db: Database,
  params: { messageId: string; highlightIds?: string[]; turnIds?: string[] },
): Promise<AssistantMessageSourceLink[]> {
  const highlightIds = Array.from(new Set(params.highlightIds ?? []));
  const turnIds = Array.from(new Set(params.turnIds ?? []));

  await db.transaction(async (tx) => {
    await tx
      .delete(messageSourceLinks)
      .where(eq(messageSourceLinks.message_id, params.messageId));

    const values = [
      ...highlightIds.map((highlightId) => ({
        message_id: params.messageId,
        highlight_id: highlightId,
        turn_id: null,
      })),
      ...turnIds.map((turnId) => ({
        message_id: params.messageId,
        highlight_id: null,
        turn_id: turnId,
      })),
    ];

    if (values.length > 0) {
      await tx.insert(messageSourceLinks).values(values);
    }
  });

  const sources = await loadMessageSources(db, [params.messageId]);
  return sources.get(params.messageId) ?? [];
}
