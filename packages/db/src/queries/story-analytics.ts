import type { Database } from "@db/client";
import {
  assistantThreadSources,
  assistantThreads,
  playbookStepHighlights,
  playbookSteps,
  playbooks,
  teamHighlightStates,
  teamStoryStates,
} from "@db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

export type StoryMetricsRow = {
  storyId: string;
  teamId: string;
  readCount: number;
  unreadCount: number;
  archivedCount: number;
  pinnedCount: number;
  averageRating: number | null;
  lastViewedAt: string | null;
};

export async function getStoryMetrics(
  db: Database,
  params: { teamId?: string; storyIds?: string[] } = {},
): Promise<StoryMetricsRow[]> {
  const { teamId, storyIds } = params;
  const query = db
    .select({
      storyId: teamStoryStates.story_id,
      teamId: teamStoryStates.team_id,
      readCount: sql<number>`count(*) filter (where ${teamStoryStates.state} = 'read')::int`,
      unreadCount: sql<number>`count(*) filter (where ${teamStoryStates.state} = 'unread')::int`,
      archivedCount: sql<number>`count(*) filter (where ${teamStoryStates.state} = 'archived')::int`,
      pinnedCount: sql<number>`count(*) filter (where ${teamStoryStates.pinned} is true)::int`,
      averageRating: sql<number | null>`avg(${teamStoryStates.rating})::float`,
      lastViewedAt: sql<string | null>`max(${teamStoryStates.last_viewed_at})`,
    })
    .from(teamStoryStates)
    .groupBy(teamStoryStates.story_id, teamStoryStates.team_id);

  const conditions: any[] = [];
  if (teamId) {
    conditions.push(eq(teamStoryStates.team_id, teamId));
  }
  if (storyIds?.length) {
    conditions.push(inArray(teamStoryStates.story_id, storyIds));
  }

  if (conditions.length === 1) {
    query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query.where(and(...conditions));
  }

  return query;
}

export type HighlightEngagementRow = {
  highlightId: string;
  teamId: string;
  activeCount: number;
  archivedCount: number;
  pinnedCount: number;
  linkedPlaybookSteps: number;
  linkedThreads: number;
  lastUpdatedAt: string | null;
};

export async function getHighlightEngagement(
  db: Database,
  params: { teamId?: string; highlightIds?: string[] } = {},
): Promise<HighlightEngagementRow[]> {
  const { teamId, highlightIds } = params;

  const base = db
    .select({
      highlightId: teamHighlightStates.highlight_id,
      teamId: teamHighlightStates.team_id,
      activeCount: sql<number>`count(*) filter (where ${teamHighlightStates.state} = 'active')::int`,
      archivedCount: sql<number>`count(*) filter (where ${teamHighlightStates.state} = 'archived')::int`,
      pinnedCount: sql<number>`count(*) filter (where ${teamHighlightStates.pinned_by} is not null)::int`,
      lastUpdatedAt: sql<string | null>`max(${teamHighlightStates.updated_at})`,
    })
    .from(teamHighlightStates)
    .groupBy(teamHighlightStates.highlight_id, teamHighlightStates.team_id)
    .as("state_counts");

  const playbookLinks = db
    .select({
      highlightId: playbookStepHighlights.highlight_id,
      teamId: playbooks.team_id,
      linkedPlaybookSteps: sql<number>`count(distinct ${playbookStepHighlights.playbook_step_id})::int`,
    })
    .from(playbookStepHighlights)
    .innerJoin(
      playbookSteps,
      eq(playbookSteps.id, playbookStepHighlights.playbook_step_id),
    )
    .innerJoin(playbooks, eq(playbooks.id, playbookSteps.playbook_id))
    .groupBy(playbookStepHighlights.highlight_id, playbooks.team_id)
    .as("playbook_links");

  const threadLinks = db
    .select({
      highlightId: assistantThreadSources.highlight_id,
      teamId: assistantThreads.team_id,
      linkedThreads: sql<number>`count(distinct ${assistantThreadSources.thread_id})::int`,
    })
    .from(assistantThreadSources)
    .innerJoin(
      assistantThreads,
      eq(assistantThreads.id, assistantThreadSources.thread_id),
    )
    .where(sql`${assistantThreadSources.highlight_id} is not null`)
    .groupBy(assistantThreadSources.highlight_id, assistantThreads.team_id)
    .as("thread_links");

  const query = db
    .select({
      highlightId: base.highlightId,
      teamId: base.teamId,
      activeCount: base.activeCount,
      archivedCount: base.archivedCount,
      pinnedCount: base.pinnedCount,
      linkedPlaybookSteps: sql<number>`coalesce(${playbookLinks.linkedPlaybookSteps}, 0)::int`,
      linkedThreads: sql<number>`coalesce(${threadLinks.linkedThreads}, 0)::int`,
      lastUpdatedAt: base.lastUpdatedAt,
    })
    .from(base)
    .leftJoin(
      playbookLinks,
      and(
        eq(playbookLinks.highlightId, base.highlightId),
        eq(playbookLinks.teamId, base.teamId),
      ),
    )
    .leftJoin(
      threadLinks,
      and(
        eq(threadLinks.highlightId, base.highlightId),
        eq(threadLinks.teamId, base.teamId),
      ),
    );

  const conditions: any[] = [];
  if (teamId) {
    conditions.push(eq(base.teamId, teamId));
  }
  if (highlightIds?.length) {
    conditions.push(inArray(base.highlightId, highlightIds));
  }

  if (conditions.length === 1) {
    query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query.where(and(...conditions));
  }

  return query;
}

export type PlaybookProgressRow = {
  playbookId: string;
  teamId: string;
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  pendingSteps: number;
  skippedSteps: number;
  completionPercent: number;
  lastCompletedAt: string | null;
};

export async function getPlaybookProgress(
  db: Database,
  params: { teamId?: string; playbookIds?: string[] } = {},
): Promise<PlaybookProgressRow[]> {
  const { teamId, playbookIds } = params;

  const query = db
    .select({
      playbookId: playbooks.id,
      teamId: playbooks.team_id,
      totalSteps: sql<number>`count(${playbookSteps.id})::int`,
      completedSteps: sql<number>`count(*) filter (where ${playbookSteps.status} = 'completed')::int`,
      inProgressSteps: sql<number>`count(*) filter (where ${playbookSteps.status} = 'in_progress')::int`,
      pendingSteps: sql<number>`count(*) filter (where ${playbookSteps.status} = 'pending')::int`,
      skippedSteps: sql<number>`count(*) filter (where ${playbookSteps.status} = 'skipped')::int`,
      completionPercent: sql<number>`case when count(${playbookSteps.id}) = 0 then 0 else round(count(*) filter (where ${playbookSteps.status} = 'completed')::numeric / nullif(count(${playbookSteps.id})::numeric, 0) * 100, 2)::float end`,
      lastCompletedAt: sql<string | null>`max(${playbookSteps.completed_at})`,
    })
    .from(playbooks)
    .leftJoin(playbookSteps, eq(playbookSteps.playbook_id, playbooks.id))
    .groupBy(playbooks.id, playbooks.team_id);

  const filters: any[] = [];
  if (teamId) {
    filters.push(eq(playbooks.team_id, teamId));
  }
  if (playbookIds?.length) {
    filters.push(inArray(playbooks.id, playbookIds));
  }

  if (filters.length === 1) {
    query.where(filters[0]);
  } else if (filters.length > 1) {
    query.where(and(...filters));
  }

  return query;
}
