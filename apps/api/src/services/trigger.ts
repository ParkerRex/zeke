import { configure, runs, tasks } from "@trigger.dev/sdk";

const triggerApiKey =
  process.env.TRIGGER_SECRET_KEY ??
  process.env.TRIGGER_API_KEY ??
  process.env.TRIGGER_SECRET ??
  process.env.TRIGGER_DEV_API_KEY ??
  null;

const triggerApiUrl = process.env.TRIGGER_API_URL ?? process.env.TRIGGER_ENDPOINT;

let configured = false;

const ensureConfigured = () => {
  if (configured) {
    return;
  }

  if (!triggerApiKey) {
    throw new Error(
      "Trigger.dev API key is not configured (expected TRIGGER_SECRET_KEY or equivalent)",
    );
  }

  configure({
    accessToken: triggerApiKey,
    baseURL: triggerApiUrl,
  });

  configured = true;
};

export const triggerTaskRun = async (
  taskId: string,
  payload: Record<string, unknown>,
) => {
  ensureConfigured();
  return tasks.trigger(taskId, payload);
};

export const getTriggerRun = async (runId: string) => {
  ensureConfigured();
  return runs.retrieve(runId);
};
