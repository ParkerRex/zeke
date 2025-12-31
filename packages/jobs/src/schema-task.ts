import type PgBoss from "pg-boss";
import { type z } from "zod";
import { getBoss } from "./boss";
import { withJobDb } from "./init";

export interface TaskLogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

export interface TaskContext {
  jobId: string;
  logger: TaskLogger;
  run: {
    id: string;
  };
}

export interface TaskOptions<T extends z.ZodType> {
  id: string;
  schema: T;
  queue?: {
    concurrencyLimit?: number;
  };
  run: (payload: z.infer<T>, ctx: TaskContext) => Promise<unknown>;
}

export interface Task<T extends z.ZodType> {
  id: string;
  trigger: (payload: z.infer<T>) => Promise<string>;
  register: () => Promise<void>;
}

function createLogger(taskId: string, jobId: string): TaskLogger {
  const formatLog = (
    level: string,
    message: string,
    data?: Record<string, unknown>,
  ) => {
    const timestamp = new Date().toISOString();
    const logData = { taskId, jobId, ...data };
    console.log(
      JSON.stringify({
        timestamp,
        level,
        message,
        ...logData,
      }),
    );
  };

  return {
    info: (message, data) => formatLog("info", message, data),
    warn: (message, data) => formatLog("warn", message, data),
    error: (message, data) => formatLog("error", message, data),
    debug: (message, data) => formatLog("debug", message, data),
  };
}

// Store registered tasks for worker startup
const registeredTasks: Array<{ id: string; register: () => Promise<void> }> =
  [];

// Task registry for dynamic triggering by task ID
const taskRegistry = new Map<string, Task<z.ZodType>>();

export function schemaTask<T extends z.ZodType>(
  options: TaskOptions<T>,
): Task<T> {
  const { id, schema, queue, run } = options;

  const task: Task<T> = {
    id,

    async trigger(payload: z.infer<T>): Promise<string> {
      const boss = await getBoss();
      const validated = schema.parse(payload);
      const jobId = await boss.send(id, validated as object);
      if (!jobId) {
        throw new Error(`Failed to queue job for task ${id}`);
      }
      return jobId;
    },

    async register(): Promise<void> {
      const boss = await getBoss();
      const teamSize = queue?.concurrencyLimit ?? 1;

      await boss.work<z.infer<T>>(
        id,
        { teamSize },
        async (job: PgBoss.Job<z.infer<T>>) => {
          const logger = createLogger(id, job.id);

          logger.info("job_started", {
            payload: job.data,
          });

          const ctx: TaskContext = {
            jobId: job.id,
            logger,
            run: { id: job.id },
          };

          // Wrap job execution with database context
          return withJobDb(async () => {
            try {
              const validated = schema.parse(job.data);
              const result = await run(validated, ctx);

              logger.info("job_completed", {
                result: result !== undefined ? "has_result" : "no_result",
              });

              return result;
            } catch (error) {
              logger.error("job_failed", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              });
              throw error;
            }
          });
        },
      );

      console.log(
        `[pg-boss] Registered handler for task: ${id} (concurrency: ${teamSize})`,
      );
    },
  };

  // Track for worker registration
  registeredTasks.push({ id, register: task.register });

  // Register in task registry for dynamic triggering
  taskRegistry.set(id, task as Task<z.ZodType>);

  return task;
}

export async function registerAllTasks(): Promise<void> {
  for (const task of registeredTasks) {
    await task.register();
  }
  console.log(`[pg-boss] Registered ${registeredTasks.length} task handlers`);
}

// Re-export logger for tasks that import it directly
export const logger: TaskLogger = {
  info: (message, data) =>
    console.log(JSON.stringify({ level: "info", message, ...data })),
  warn: (message, data) =>
    console.log(JSON.stringify({ level: "warn", message, ...data })),
  error: (message, data) =>
    console.log(JSON.stringify({ level: "error", message, ...data })),
  debug: (message, data) =>
    console.log(JSON.stringify({ level: "debug", message, ...data })),
};

// Helper to trigger tasks by ID (similar to Trigger.dev's tasks.trigger)
export const tasks = {
  async trigger(
    taskId: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const task = taskRegistry.get(taskId);
    if (!task) {
      // Fallback to direct pg-boss send if task not registered
      const boss = await getBoss();
      const jobId = await boss.send(taskId, payload);
      if (!jobId) {
        throw new Error(`Failed to queue job for task ${taskId}`);
      }
      return jobId;
    }
    return task.trigger(payload);
  },
};
