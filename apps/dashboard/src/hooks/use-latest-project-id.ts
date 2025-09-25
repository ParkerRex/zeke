// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import { useLocalStorage } from "./use-local-storage";

export function useLatestProjectId() {
  const [latestProjectId, setLatestProjectId] = useLocalStorage<string | null>(
    "latest-project-id",
    null,
  );

  return {
    latestProjectId,
    setLatestProjectId,
  };
}
