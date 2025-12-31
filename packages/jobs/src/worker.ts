import { getBoss, stopBoss } from "./boss";
import { registerAllTasks } from "./schema-task";
import { registerSchedules } from "./scheduler";

// Import all tasks to ensure they're registered
import "./tasks";

async function main() {
  console.log("[worker] Starting jobs worker...");

  try {
    // Initialize pg-boss
    const boss = await getBoss();
    console.log("[worker] pg-boss connected");

    // Register all task handlers
    await registerAllTasks();

    // Register cron schedules
    await registerSchedules();

    console.log("[worker] Jobs worker started successfully");

    // Keep the process running
    await new Promise<void>((resolve) => {
      // Graceful shutdown handlers
      const shutdown = async (signal: string) => {
        console.log(`[worker] Received ${signal}, shutting down gracefully...`);
        await stopBoss();
        resolve();
      };

      process.on("SIGTERM", () => shutdown("SIGTERM"));
      process.on("SIGINT", () => shutdown("SIGINT"));

      // Handle uncaught errors
      process.on("uncaughtException", (error) => {
        console.error("[worker] Uncaught exception:", error);
        shutdown("uncaughtException");
      });

      process.on("unhandledRejection", (reason) => {
        console.error("[worker] Unhandled rejection:", reason);
        shutdown("unhandledRejection");
      });
    });

    process.exit(0);
  } catch (error) {
    console.error("[worker] Failed to start:", error);
    process.exit(1);
  }
}

main();
