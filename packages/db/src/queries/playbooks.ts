import type { Database } from "@db/client";
import {
  customers,
  type highlightOrigin,
  highlights,
  playbookOutputs,
  playbookRunEvents,
  type playbookRunStatus,
  playbookRuns,
  type playbookStatus,
  playbookStepHighlights,
  playbookSteps,
  playbookTemplateSteps,
  playbookTemplates,
  playbooks,
  type stepStatus,
  teamGoals,
} from "@db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

type PlaybookStatus = (typeof playbookStatus.enumValues)[number];
type PlaybookRunStatus = (typeof playbookRunStatus.enumValues)[number];
type StepStatus = (typeof stepStatus.enumValues)[number];

type HighlightOrigin = (typeof highlightOrigin.enumValues)[number];

export type PlaybookTemplateSummary = {
  id: string;
  title: string;
  description: string | null;
  targetRole: string | null;
  defaultChannel: string | null;
  isPublic: boolean;
  metadata: Record<string, unknown> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stepCount: number;
};

export type PlaybookTemplateStepRecord = {
  id: string;
  templateId: string;
  title: string;
  outputType: string | null;
  position: number;
  defaultPayload: Record<string, unknown> | null;
};

export type PlaybookTemplateRecord = PlaybookTemplateSummary & {
  steps: PlaybookTemplateStepRecord[];
};

export type PlaybookSummary = {
  id: string;
  teamId: string;
  storyId: string | null;
  templateId: string | null;
  customerId: string | null;
  goalId: string | null;
  createdBy: string;
  status: PlaybookStatus;
  createdAt: string;
  publishedAt: string | null;
  template: { id: string; title: string | null } | null;
  customer: { id: string; name: string | null } | null;
  goal: { id: string; title: string | null } | null;
  stepCount: number;
  highlightCount: number;
};

export type PlaybookOutputRecord = {
  id: string;
  playbookId: string;
  outputType: string;
  externalUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type PlaybookStepHighlightLink = {
  id: string;
  playbookStepId: string;
  highlightId: string;
  highlight: {
    id: string;
    storyId: string;
    teamId: string | null;
    title: string | null;
    summary: string | null;
    quote: string | null;
    startSeconds: number | null;
    endSeconds: number | null;
    origin: HighlightOrigin;
    createdAt: string;
  };
};

export type PlaybookStepRecord = {
  id: string;
  playbookId: string;
  templateStepId: string | null;
  assignedTo: string | null;
  status: StepStatus;
  content: string | null;
  position: number;
  completedAt: string | null;
  templateStep: {
    id: string;
    title: string;
    outputType: string | null;
    defaultPayload: Record<string, unknown> | null;
  } | null;
  highlights: PlaybookStepHighlightLink[];
};

export type PlaybookDetail = {
  summary: PlaybookSummary;
  steps: PlaybookStepRecord[];
  outputs: PlaybookOutputRecord[];
};

export type PlaybookRunRecord = {
  id: string;
  playbookId: string;
  teamId: string;
  triggeredBy: string | null;
  triggerSource: string | null;
  status: PlaybookRunStatus;
  metadata: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
};

export type PlaybookRunEventRecord = {
  id: string;
  runId: string;
  stepId: string | null;
  eventType: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function mapTemplateStepRow(row: {
  id: string;
  templateId: string;
  title: string;
  outputType: string | null;
  position: number;
  defaultPayload: Record<string, unknown> | null;
}): PlaybookTemplateStepRecord {
  return {
    id: row.id,
    templateId: row.templateId,
    title: row.title,
    outputType: row.outputType,
    position: row.position,
    defaultPayload: row.defaultPayload,
  };
}

function mapTemplateSummaryRow(row: {
  id: string;
  title: string;
  description: string | null;
  targetRole: string | null;
  defaultChannel: string | null;
  isPublic: boolean;
  metadata: Record<string, unknown> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stepCount: number | null;
}): PlaybookTemplateSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    targetRole: row.targetRole,
    defaultChannel: row.defaultChannel,
    isPublic: row.isPublic,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    stepCount: Number(row.stepCount ?? 0),
  };
}

function mapSummaryRow(row: {
  id: string;
  teamId: string;
  storyId: string | null;
  templateId: string | null;
  customerId: string | null;
  goalId: string | null;
  createdBy: string;
  status: PlaybookStatus;
  createdAt: string;
  publishedAt: string | null;
  templateTitle: string | null;
  customerName: string | null;
  goalTitle: string | null;
  stepCount: number | null;
  highlightCount: number | null;
}): PlaybookSummary {
  return {
    id: row.id,
    teamId: row.teamId,
    storyId: row.storyId,
    templateId: row.templateId,
    customerId: row.customerId,
    goalId: row.goalId,
    createdBy: row.createdBy,
    status: row.status,
    createdAt: row.createdAt,
    publishedAt: row.publishedAt,
    template: row.templateId
      ? {
          id: row.templateId,
          title: row.templateTitle,
        }
      : null,
    customer: row.customerId
      ? {
          id: row.customerId,
          name: row.customerName,
        }
      : null,
    goal: row.goalId
      ? {
          id: row.goalId,
          title: row.goalTitle,
        }
      : null,
    stepCount: Number(row.stepCount ?? 0),
    highlightCount: Number(row.highlightCount ?? 0),
  };
}

async function fetchPlaybookSummaries(
  db: Database,
  filters: {
    teamId?: string;
    playbookIds?: string[];
    storyId?: string | null;
    customerId?: string | null;
    status?: string[];
  } = {},
): Promise<PlaybookSummary[]> {
  const conditions: SQL[] = [];

  if (filters.teamId) {
    conditions.push(eq(playbooks.team_id, filters.teamId));
  }

  if (filters.playbookIds?.length) {
    conditions.push(inArray(playbooks.id, filters.playbookIds));
  }

  if (filters.storyId !== undefined) {
    conditions.push(
      filters.storyId === null
        ? sql`${playbooks.story_id} is null`
        : eq(playbooks.story_id, filters.storyId),
    );
  }

  if (filters.customerId !== undefined) {
    conditions.push(
      filters.customerId === null
        ? sql`${playbooks.customer_id} is null`
        : eq(playbooks.customer_id, filters.customerId),
    );
  }

  if (filters.status?.length) {
    conditions.push(inArray(playbooks.status, filters.status));
  }

  let query = db
    .select({
      id: playbooks.id,
      teamId: playbooks.team_id,
      storyId: playbooks.story_id,
      templateId: playbooks.template_id,
      customerId: playbooks.customer_id,
      goalId: playbooks.goal_id,
      createdBy: playbooks.created_by,
      status: playbooks.status,
      createdAt: playbooks.created_at,
      publishedAt: playbooks.published_at,
      templateTitle: playbookTemplates.title,
      customerName: customers.name,
      goalTitle: teamGoals.title,
      stepCount:
        sql<number>`cast(count(distinct ${playbookSteps.id}) as int)`.as(
          "stepCount",
        ),
      highlightCount:
        sql<number>`cast(count(distinct ${playbookStepHighlights.id}) as int)`.as(
          "highlightCount",
        ),
    })
    .from(playbooks)
    .leftJoin(
      playbookTemplates,
      eq(playbooks.template_id, playbookTemplates.id),
    )
    .leftJoin(customers, eq(playbooks.customer_id, customers.id))
    .leftJoin(teamGoals, eq(playbooks.goal_id, teamGoals.id))
    .leftJoin(playbookSteps, eq(playbookSteps.playbook_id, playbooks.id))
    .leftJoin(
      playbookStepHighlights,
      eq(playbookStepHighlights.playbook_step_id, playbookSteps.id),
    );

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rows = await query
    .groupBy(
      playbooks.id,
      playbooks.team_id,
      playbooks.story_id,
      playbooks.template_id,
      playbooks.customer_id,
      playbooks.goal_id,
      playbooks.created_by,
      playbooks.status,
      playbooks.created_at,
      playbooks.published_at,
      playbookTemplates.id,
      playbookTemplates.title,
      customers.id,
      customers.name,
      teamGoals.id,
      teamGoals.title,
    )
    .orderBy(desc(playbooks.created_at));

  return rows.map((row) =>
    mapSummaryRow({
      id: row.id,
      teamId: row.teamId,
      storyId: row.storyId,
      templateId: row.templateId,
      customerId: row.customerId,
      goalId: row.goalId,
      createdBy: row.createdBy,
      status: row.status,
      createdAt: row.createdAt,
      publishedAt: row.publishedAt,
      templateTitle: row.templateTitle,
      customerName: row.customerName,
      goalTitle: row.goalTitle,
      stepCount: row.stepCount,
      highlightCount: row.highlightCount,
    }),
  );
}

async function loadStepHighlights(
  db: Database,
  stepIds: string[],
): Promise<Map<string, PlaybookStepHighlightLink[]>> {
  if (stepIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      id: playbookStepHighlights.id,
      playbookStepId: playbookStepHighlights.playbook_step_id,
      highlightId: playbookStepHighlights.highlight_id,
      highlightStoryId: highlights.story_id,
      highlightTeamId: highlights.team_id,
      highlightTitle: highlights.title,
      highlightSummary: highlights.summary,
      highlightQuote: highlights.quote,
      highlightStart: highlights.start_seconds,
      highlightEnd: highlights.end_seconds,
      highlightOrigin: highlights.origin,
      highlightCreatedAt: highlights.created_at,
    })
    .from(playbookStepHighlights)
    .innerJoin(
      highlights,
      eq(highlights.id, playbookStepHighlights.highlight_id),
    )
    .where(inArray(playbookStepHighlights.playbook_step_id, stepIds))
    .orderBy(
      playbookStepHighlights.playbook_step_id,
      playbookStepHighlights.id,
    );

  return rows.reduce<Map<string, PlaybookStepHighlightLink[]>>((acc, row) => {
    const list = acc.get(row.playbookStepId) ?? [];
    list.push({
      id: row.id,
      playbookStepId: row.playbookStepId,
      highlightId: row.highlightId,
      highlight: {
        id: row.highlightId,
        storyId: row.highlightStoryId,
        teamId: row.highlightTeamId,
        title: row.highlightTitle,
        summary: row.highlightSummary,
        quote: row.highlightQuote,
        startSeconds: parseNumeric(row.highlightStart),
        endSeconds: parseNumeric(row.highlightEnd),
        origin: row.highlightOrigin as HighlightOrigin,
        createdAt: row.highlightCreatedAt,
      },
    });
    acc.set(row.playbookStepId, list);
    return acc;
  }, new Map());
}

async function loadPlaybookSteps(
  db: Database,
  playbookId: string,
  options: { stepIds?: string[] } = {},
): Promise<PlaybookStepRecord[]> {
  const conditions: SQL[] = [eq(playbookSteps.playbook_id, playbookId)];
  if (options.stepIds?.length) {
    conditions.push(inArray(playbookSteps.id, options.stepIds));
  }

  let query = db
    .select({
      id: playbookSteps.id,
      playbookId: playbookSteps.playbook_id,
      templateStepId: playbookSteps.template_step_id,
      assignedTo: playbookSteps.assigned_to,
      status: playbookSteps.status,
      content: playbookSteps.content,
      position: playbookSteps.position,
      completedAt: playbookSteps.completed_at,
      templateStepTitle: playbookTemplateSteps.title,
      templateStepOutputType: playbookTemplateSteps.output_type,
      templateStepDefaultPayload: playbookTemplateSteps.default_payload,
    })
    .from(playbookSteps)
    .leftJoin(
      playbookTemplateSteps,
      eq(playbookTemplateSteps.id, playbookSteps.template_step_id),
    );

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rows = await query.orderBy(
    asc(playbookSteps.position),
    playbookSteps.id,
  );

  const stepIds = rows.map((row) => row.id);
  const highlightsByStep = await loadStepHighlights(db, stepIds);

  return rows.map((row) => ({
    id: row.id,
    playbookId: row.playbookId,
    templateStepId: row.templateStepId,
    assignedTo: row.assignedTo,
    status: row.status as StepStatus,
    content: row.content,
    position: row.position,
    completedAt: row.completedAt,
    templateStep: row.templateStepId
      ? {
          id: row.templateStepId,
          title: row.templateStepTitle ?? "",
          outputType: row.templateStepOutputType,
          defaultPayload: (row.templateStepDefaultPayload ?? null) as Record<
            string,
            unknown
          > | null,
        }
      : null,
    highlights: highlightsByStep.get(row.id) ?? [],
  }));
}

async function loadPlaybookOutputs(
  db: Database,
  playbookId: string,
): Promise<PlaybookOutputRecord[]> {
  const rows = await db
    .select({
      id: playbookOutputs.id,
      playbookId: playbookOutputs.playbook_id,
      outputType: playbookOutputs.output_type,
      externalUrl: playbookOutputs.external_url,
      metadata: playbookOutputs.metadata,
      createdAt: playbookOutputs.created_at,
    })
    .from(playbookOutputs)
    .where(eq(playbookOutputs.playbook_id, playbookId))
    .orderBy(desc(playbookOutputs.created_at));

  return rows.map((row) => ({
    id: row.id,
    playbookId: row.playbookId,
    outputType: row.outputType,
    externalUrl: row.externalUrl,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt,
  }));
}

/**
 * Load all public playbook templates that teams can instantiate in Apply.
 */
export async function getPlaybookTemplates(
  db: Database,
): Promise<PlaybookTemplateSummary[]> {
  const rows = await db
    .select({
      id: playbookTemplates.id,
      title: playbookTemplates.title,
      description: playbookTemplates.description,
      targetRole: playbookTemplates.target_role,
      defaultChannel: playbookTemplates.default_channel,
      isPublic: playbookTemplates.is_public,
      metadata: playbookTemplates.metadata,
      createdBy: playbookTemplates.created_by,
      createdAt: playbookTemplates.created_at,
      updatedAt: playbookTemplates.updated_at,
      stepCount:
        sql<number>`cast(count(${playbookTemplateSteps.id}) as int)`.as(
          "stepCount",
        ),
    })
    .from(playbookTemplates)
    .leftJoin(
      playbookTemplateSteps,
      eq(playbookTemplateSteps.template_id, playbookTemplates.id),
    )
    .where(eq(playbookTemplates.is_public, true))
    .groupBy(
      playbookTemplates.id,
      playbookTemplates.title,
      playbookTemplates.description,
      playbookTemplates.target_role,
      playbookTemplates.default_channel,
      playbookTemplates.is_public,
      playbookTemplates.metadata,
      playbookTemplates.created_by,
      playbookTemplates.created_at,
      playbookTemplates.updated_at,
    )
    .orderBy(asc(playbookTemplates.title));

  return rows.map((row) =>
    mapTemplateSummaryRow({
      id: row.id,
      title: row.title,
      description: row.description,
      targetRole: row.targetRole,
      defaultChannel: row.defaultChannel,
      isPublic: row.isPublic,
      metadata: (row.metadata ?? null) as Record<string, unknown> | null,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      stepCount: row.stepCount,
    }),
  );
}

/**
 * Fetch a single playbook template with ordered steps for form hydration.
 */
export async function getPlaybookTemplateById(
  db: Database,
  params: { templateId: string },
): Promise<PlaybookTemplateRecord | null> {
  const [template] = await db
    .select({
      id: playbookTemplates.id,
      title: playbookTemplates.title,
      description: playbookTemplates.description,
      targetRole: playbookTemplates.target_role,
      defaultChannel: playbookTemplates.default_channel,
      isPublic: playbookTemplates.is_public,
      metadata: playbookTemplates.metadata,
      createdBy: playbookTemplates.created_by,
      createdAt: playbookTemplates.created_at,
      updatedAt: playbookTemplates.updated_at,
    })
    .from(playbookTemplates)
    .where(eq(playbookTemplates.id, params.templateId))
    .limit(1);

  if (!template) {
    return null;
  }

  const stepRows = await db
    .select({
      id: playbookTemplateSteps.id,
      templateId: playbookTemplateSteps.template_id,
      title: playbookTemplateSteps.title,
      outputType: playbookTemplateSteps.output_type,
      position: playbookTemplateSteps.position,
      defaultPayload: playbookTemplateSteps.default_payload,
    })
    .from(playbookTemplateSteps)
    .where(eq(playbookTemplateSteps.template_id, template.id))
    .orderBy(asc(playbookTemplateSteps.position), playbookTemplateSteps.id);

  return {
    ...mapTemplateSummaryRow({
      id: template.id,
      title: template.title,
      description: template.description,
      targetRole: template.targetRole,
      defaultChannel: template.defaultChannel,
      isPublic: template.isPublic,
      metadata: (template.metadata ?? null) as Record<string, unknown> | null,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      stepCount: stepRows.length,
    }),
    steps: stepRows.map((row) =>
      mapTemplateStepRow({
        id: row.id,
        templateId: row.templateId,
        title: row.title,
        outputType: row.outputType,
        position: row.position,
        defaultPayload: (row.defaultPayload ?? null) as Record<
          string,
          unknown
        > | null,
      }),
    ),
  };
}

/**
 * List playbooks for a team, optionally filtered by story, customer, or status.
 */
export async function getTeamPlaybooks(
  db: Database,
  params: {
    teamId: string;
    storyId?: string | null;
    customerId?: string | null;
    status?: string[];
  },
): Promise<PlaybookSummary[]> {
  return fetchPlaybookSummaries(db, {
    teamId: params.teamId,
    storyId: params.storyId,
    customerId: params.customerId,
    status: params.status,
  });
}

/**
 * Create a new playbook and optionally seed steps from a template.
 */
export async function createPlaybook(
  db: Database,
  params: {
    teamId: string;
    storyId?: string | null;
    templateId?: string | null;
    customerId?: string | null;
    goalId?: string | null;
    createdBy: string;
    status?: PlaybookStatus;
    publishOnCreate?: boolean;
  },
): Promise<PlaybookDetail> {
  const initialStatus: PlaybookStatus =
    params.status ?? (params.publishOnCreate ? "published" : "draft");

  const inserted = await db.transaction(async (tx) => {
    const [playbookRow] = await tx
      .insert(playbooks)
      .values({
        team_id: params.teamId,
        story_id: params.storyId ?? null,
        template_id: params.templateId ?? null,
        customer_id: params.customerId ?? null,
        goal_id: params.goalId ?? null,
        created_by: params.createdBy,
        status: initialStatus,
        published_at: initialStatus === "published" ? sql`now()` : null,
      })
      .returning({ id: playbooks.id });

    if (!playbookRow) {
      throw new Error("Failed to insert playbook");
    }

    if (params.templateId) {
      const templateSteps = await tx
        .select({
          id: playbookTemplateSteps.id,
          position: playbookTemplateSteps.position,
        })
        .from(playbookTemplateSteps)
        .where(eq(playbookTemplateSteps.template_id, params.templateId))
        .orderBy(asc(playbookTemplateSteps.position), playbookTemplateSteps.id);

      if (templateSteps.length > 0) {
        await tx.insert(playbookSteps).values(
          templateSteps.map((step) => ({
            playbook_id: playbookRow.id,
            template_step_id: step.id,
            position: step.position,
          })),
        );
      }
    }

    return playbookRow.id;
  });

  const detail = await getPlaybookById(db, {
    playbookId: inserted,
    teamId: params.teamId,
  });

  if (!detail) {
    throw new Error("Playbook was created but could not be reloaded");
  }

  return detail;
}

/**
 * Retrieve a single playbook with steps, highlights, and recorded outputs.
 */
export async function getPlaybookById(
  db: Database,
  params: { playbookId: string; teamId: string },
): Promise<PlaybookDetail | null> {
  const summaries = await fetchPlaybookSummaries(db, {
    teamId: params.teamId,
    playbookIds: [params.playbookId],
  });

  const summary = summaries[0];
  if (!summary) {
    return null;
  }

  const [steps, outputs] = await Promise.all([
    loadPlaybookSteps(db, summary.id),
    loadPlaybookOutputs(db, summary.id),
  ]);

  return {
    summary,
    steps,
    outputs,
  };
}

/**
 * Update a playbook's status and optional publish timestamp.
 */
export async function updatePlaybookStatus(
  db: Database,
  params: {
    playbookId: string;
    teamId: string;
    status: PlaybookStatus;
    publishedAt?: string | null;
  },
): Promise<PlaybookSummary | null> {
  const publishedAtValue =
    params.publishedAt !== undefined
      ? params.publishedAt
      : params.status === "published"
        ? sql`now()`
        : null;

  await db
    .update(playbooks)
    .set({
      status: params.status,
      published_at: publishedAtValue,
    })
    .where(
      and(
        eq(playbooks.id, params.playbookId),
        eq(playbooks.team_id, params.teamId),
      ),
    );

  const summaries = await fetchPlaybookSummaries(db, {
    teamId: params.teamId,
    playbookIds: [params.playbookId],
  });

  return summaries[0] ?? null;
}

/**
 * Create or update an individual playbook step.
 */
export async function upsertPlaybookStep(
  db: Database,
  params: {
    playbookId: string;
    stepId?: string;
    templateStepId?: string | null;
    assignedTo?: string | null;
    status?: StepStatus;
    content?: string | null;
    position?: number | null;
    completedAt?: string | null;
  },
): Promise<PlaybookStepRecord | null> {
  if (params.stepId) {
    const updateData: Record<string, unknown> = {};

    if (params.templateStepId !== undefined) {
      updateData.template_step_id = params.templateStepId ?? null;
    }

    if (params.assignedTo !== undefined) {
      updateData.assigned_to = params.assignedTo ?? null;
    }

    if (params.status !== undefined) {
      updateData.status = params.status;
    }

    if (params.content !== undefined) {
      updateData.content = params.content ?? null;
    }

    if (params.position !== undefined) {
      updateData.position = params.position ?? 0;
    }

    if (params.completedAt !== undefined) {
      updateData.completed_at = params.completedAt ?? null;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(playbookSteps)
        .set(updateData)
        .where(
          and(
            eq(playbookSteps.id, params.stepId),
            eq(playbookSteps.playbook_id, params.playbookId),
          ),
        );
    }
  } else {
    const nextPosition = await db
      .select({
        next: sql<number>`coalesce(max(${playbookSteps.position}) + 1, 0)`,
      })
      .from(playbookSteps)
      .where(eq(playbookSteps.playbook_id, params.playbookId))
      .then(([row]) => row?.next ?? 0);

    const [inserted] = await db
      .insert(playbookSteps)
      .values({
        playbook_id: params.playbookId,
        template_step_id: params.templateStepId ?? null,
        assigned_to: params.assignedTo ?? null,
        status: params.status ?? "pending",
        content: params.content ?? null,
        position: params.position ?? nextPosition,
        completed_at: params.completedAt ?? null,
      })
      .returning({ id: playbookSteps.id });

    if (!inserted) {
      return null;
    }

    params.stepId = inserted.id;
  }

  if (!params.stepId) {
    return null;
  }

  const [step] = await loadPlaybookSteps(db, params.playbookId, {
    stepIds: [params.stepId],
  });

  return step ?? null;
}

/**
 * Link a saved highlight to a playbook step for provenance.
 */
export async function attachHighlightToStep(
  db: Database,
  params: { playbookStepId: string; highlightId: string },
): Promise<PlaybookStepHighlightLink | null> {
  const [inserted] = await db
    .insert(playbookStepHighlights)
    .values({
      playbook_step_id: params.playbookStepId,
      highlight_id: params.highlightId,
    })
    .onConflictDoNothing()
    .returning({ id: playbookStepHighlights.id });

  let stepHighlightId = inserted?.id;

  if (!stepHighlightId) {
    const [existing] = await db
      .select({ id: playbookStepHighlights.id })
      .from(playbookStepHighlights)
      .where(
        and(
          eq(playbookStepHighlights.playbook_step_id, params.playbookStepId),
          eq(playbookStepHighlights.highlight_id, params.highlightId),
        ),
      )
      .limit(1);
    stepHighlightId = existing?.id;
  }

  if (!stepHighlightId) {
    return null;
  }

  const highlightsByStep = await loadStepHighlights(db, [
    params.playbookStepId,
  ]);
  const links = highlightsByStep.get(params.playbookStepId) ?? [];
  return (
    links.find((item) => item.highlightId === params.highlightId) ??
    links[0] ??
    null
  );
}

/**
 * Record an external output (brief, doc, experiment) generated by a playbook.
 */
export async function recordPlaybookOutput(
  db: Database,
  params: {
    playbookId: string;
    outputType: string;
    externalUrl?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<PlaybookOutputRecord> {
  const [row] = await db
    .insert(playbookOutputs)
    .values({
      playbook_id: params.playbookId,
      output_type: params.outputType,
      external_url: params.externalUrl ?? null,
      metadata: params.metadata ?? null,
    })
    .returning({
      id: playbookOutputs.id,
      playbookId: playbookOutputs.playbook_id,
      outputType: playbookOutputs.output_type,
      externalUrl: playbookOutputs.external_url,
      metadata: playbookOutputs.metadata,
      createdAt: playbookOutputs.created_at,
    });

  if (!row) {
    throw new Error("Failed to record playbook output");
  }

  return {
    id: row.id,
    playbookId: row.playbookId,
    outputType: row.outputType,
    externalUrl: row.externalUrl,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt,
  };
}

export async function createPlaybookRun(
  db: Database,
  params: {
    playbookId: string;
    teamId: string;
    triggeredBy?: string | null;
    triggerSource?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<PlaybookRunRecord> {
  const [row] = await db
    .insert(playbookRuns)
    .values({
      playbook_id: params.playbookId,
      team_id: params.teamId,
      triggered_by: params.triggeredBy ?? null,
      trigger_source: params.triggerSource ?? null,
      metadata: params.metadata ?? null,
    })
    .returning({
      id: playbookRuns.id,
      playbookId: playbookRuns.playbook_id,
      teamId: playbookRuns.team_id,
      triggeredBy: playbookRuns.triggered_by,
      triggerSource: playbookRuns.trigger_source,
      status: playbookRuns.status,
      metadata: playbookRuns.metadata,
      startedAt: playbookRuns.started_at,
      completedAt: playbookRuns.completed_at,
    });

  if (!row) {
    throw new Error("Failed to create playbook run");
  }

  return {
    id: row.id,
    playbookId: row.playbookId,
    teamId: row.teamId,
    triggeredBy: row.triggeredBy,
    triggerSource: row.triggerSource,
    status: row.status,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}

export async function updatePlaybookRunStatus(
  db: Database,
  params: {
    runId: string;
    status: PlaybookRunStatus;
    completedAt?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<PlaybookRunRecord | null> {
  const shouldAutoComplete = ["succeeded", "failed", "cancelled"].includes(
    params.status,
  );
  const completedAtValue =
    params.completedAt !== undefined
      ? params.completedAt
      : shouldAutoComplete
        ? sql`now()`
        : undefined;

  const updateValues: Partial<typeof playbookRuns.$inferInsert> = {
    status: params.status,
    metadata: params.metadata ?? undefined,
  };

  if (completedAtValue !== undefined) {
    updateValues.completed_at = completedAtValue;
  }

  const [row] = await db
    .update(playbookRuns)
    .set(updateValues)
    .where(eq(playbookRuns.id, params.runId))
    .returning({
      id: playbookRuns.id,
      playbookId: playbookRuns.playbook_id,
      teamId: playbookRuns.team_id,
      triggeredBy: playbookRuns.triggered_by,
      triggerSource: playbookRuns.trigger_source,
      status: playbookRuns.status,
      metadata: playbookRuns.metadata,
      startedAt: playbookRuns.started_at,
      completedAt: playbookRuns.completed_at,
    });

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    playbookId: row.playbookId,
    teamId: row.teamId,
    triggeredBy: row.triggeredBy,
    triggerSource: row.triggerSource,
    status: row.status,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}

export async function recordPlaybookRunEvent(
  db: Database,
  params: {
    runId: string;
    eventType: string;
    stepId?: string | null;
    detail?: Record<string, unknown> | null;
  },
): Promise<PlaybookRunEventRecord> {
  const [row] = await db
    .insert(playbookRunEvents)
    .values({
      run_id: params.runId,
      step_id: params.stepId ?? null,
      event_type: params.eventType,
      detail: params.detail ?? null,
    })
    .returning({
      id: playbookRunEvents.id,
      runId: playbookRunEvents.run_id,
      stepId: playbookRunEvents.step_id,
      eventType: playbookRunEvents.event_type,
      detail: playbookRunEvents.detail,
      createdAt: playbookRunEvents.created_at,
    });

  if (!row) {
    throw new Error("Failed to record playbook run event");
  }

  return {
    id: row.id,
    runId: row.runId,
    stepId: row.stepId,
    eventType: row.eventType,
    detail: (row.detail ?? null) as Record<string, unknown> | null,
    createdAt: row.createdAt,
  };
}

export async function getPlaybookRunById(
  db: Database,
  params: { runId: string },
): Promise<PlaybookRunRecord | null> {
  const [row] = await db
    .select({
      id: playbookRuns.id,
      playbookId: playbookRuns.playbook_id,
      teamId: playbookRuns.team_id,
      triggeredBy: playbookRuns.triggered_by,
      triggerSource: playbookRuns.trigger_source,
      status: playbookRuns.status,
      metadata: playbookRuns.metadata,
      startedAt: playbookRuns.started_at,
      completedAt: playbookRuns.completed_at,
    })
    .from(playbookRuns)
    .where(eq(playbookRuns.id, params.runId))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    playbookId: row.playbookId,
    teamId: row.teamId,
    triggeredBy: row.triggeredBy,
    triggerSource: row.triggerSource,
    status: row.status,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}
