import { getBoss } from "./boss";

const JOBS_CRON_TZ = process.env.JOBS_CRON_TZ || "UTC";

interface ScheduleConfig {
  taskId: string;
  cron: string;
  description: string;
}

const schedules: ScheduleConfig[] = [
  {
    taskId: "ingest-pull",
    cron: "*/5 * * * *", // Every 5 minutes
    description: "RSS feed ingestion",
  },
  {
    taskId: "ingest-pull-youtube",
    cron: "0 */6 * * *", // Every 6 hours
    description: "YouTube channel ingestion",
  },
];

export async function registerSchedules(): Promise<void> {
  const boss = await getBoss();

  for (const schedule of schedules) {
    try {
      await boss.schedule(
        schedule.taskId,
        schedule.cron,
        {},
        {
          tz: JOBS_CRON_TZ,
        },
      );
      console.log(
        `[scheduler] Registered: ${schedule.taskId} (${schedule.cron}) - ${schedule.description}`,
      );
    } catch (error) {
      console.error(
        `[scheduler] Failed to register ${schedule.taskId}:`,
        error,
      );
    }
  }

  console.log(`[scheduler] Registered ${schedules.length} schedules`);
}
