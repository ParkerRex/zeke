import PgBoss from "pg-boss";

let boss: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (!boss) {
    const connectionString =
      process.env.DATABASE_PRIMARY_URL ||
      process.env.DATABASE_PRIMARY_POOLER_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_PRIMARY_URL or DATABASE_PRIMARY_POOLER_URL must be set",
      );
    }

    boss = new PgBoss({
      connectionString,
      schema: "pgboss",
      archiveCompletedAfterSeconds: 60 * 60 * 24, // 24 hours
      deleteAfterDays: 7,
      retryLimit: 3,
      retryDelay: 1,
      retryBackoff: true,
      expireInSeconds: 60 * 60, // 1 hour default job expiry
      retentionDays: 7,
    });

    boss.on("error", (error: Error) => {
      console.error("[pg-boss] Error:", error);
    });

    await boss.start();
    console.log("[pg-boss] Started successfully");
  }
  return boss;
}

export async function stopBoss(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 30000 });
    boss = null;
    console.log("[pg-boss] Stopped");
  }
}

export { PgBoss };
