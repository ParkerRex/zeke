import "dotenv/config";

import { sql } from "drizzle-orm";

import { createJobDb } from "@zeke/db/job-client";
import {
  analyzeStory,
  fetchContent,
  ingestPull,
  ingestSource,
} from "../src/tasks";

const JOB_HANDLERS: Record<
  string,
  (payload: Record<string, unknown> | null) => Promise<void>
> = {
  "ingest:pull": async (payload) => {
    const reason =
      typeof payload?.reason === "string" && payload.reason !== "schedule"
        ? (payload.reason as "manual" | "schedule")
        : "manual";
    await ingestPull.trigger({ reason });
  },
  "ingest:source": async (payload) => {
    const sourceId = payload?.sourceId;
    if (typeof sourceId !== "string") {
      throw new Error("Missing sourceId in ingest:source payload");
    }
    await ingestSource.trigger({
      sourceId,
      reason: "retry",
    });
  },
  "ingest:fetch-content": async (payload) => {
    const rawItemIds = Array.isArray(payload?.rawItemIds)
      ? payload?.rawItemIds.filter((id): id is string => typeof id === "string")
      : [];
    if (!rawItemIds.length) {
      throw new Error("Missing rawItemIds in ingest:fetch-content payload");
    }
    await fetchContent.trigger({ rawItemIds });
  },
  "analyze:llm": async (payload) => {
    const storyId = payload?.storyId;
    if (typeof storyId !== "string") {
      throw new Error("Missing storyId in analyze:llm payload");
    }
    await analyzeStory.trigger({ storyId, trigger: "retry" });
  },
};

const KNOWN_JOB_NAMES = Object.keys(JOB_HANDLERS);

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");

  const { db, disconnect } = createJobDb();

  const jobNameFragments = KNOWN_JOB_NAMES.map((name) => sql`${name}`);
  const result = await db.execute(
    sql`
      select id, name, state, data, created_on as "createdOn"
      from pgboss.job
      where name in (${sql.join(jobNameFragments, sql`, `)})
        and state in ('created', 'retry', 'active', 'waiting')
      order by created_on asc
    `,
  );

  const rows = Array.isArray(result)
    ? (result as Array<Record<string, unknown>>)
    : ((result as { rows: Array<Record<string, unknown>> }).rows ?? []);

  if (!rows.length) {
    console.log("No pending pg-boss jobs found.");
    await disconnect();
    return;
  }

  console.log(`Found ${rows.length} pending jobs.`);

  for (const row of rows) {
    const id = String(row.id ?? "");
    const name = String(row.name ?? "");
    const handler = JOB_HANDLERS[name];

    if (!id || !handler) {
      console.warn(`Skipping job ${row.id} with unsupported name ${name}`);
      continue;
    }

    const payload = row.data ?? null;
    const createdOn = row.createdOn;
    console.log(`Replaying ${name} → Trigger.dev (job ${id})`);

    if (dryRun) {
      continue;
    }

    try {
      await handler(payload as Record<string, unknown> | null);
      await db.execute(sql`delete from pgboss.job where id = ${id}`);
      console.log(`✔ Processed ${name} (job ${id}) created ${createdOn}`);
    } catch (error) {
      console.error(`✖ Failed to replay ${name} (job ${id}):`, error);
    }
  }

  await disconnect();
}

await main();
