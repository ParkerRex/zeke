"use client";

import { useEffect, useState } from "react";
import { useJobStatus } from "./use-job-status";

type UseSyncStatusProps = {
  runId?: string;
  accessToken?: string; // Kept for API compatibility but not used (uses session auth)
};

export function useSyncStatus({ runId: initialRunId }: UseSyncStatusProps) {
  const [runId, setRunId] = useState<string | undefined>(initialRunId);
  const [status, setStatus] = useState<
    "FAILED" | "SYNCING" | "COMPLETED" | null
  >(null);

  const {
    status: jobStatus,
    output,
    error,
  } = useJobStatus({
    runId,
    enabled: !!runId,
  });

  useEffect(() => {
    if (initialRunId) {
      setRunId(initialRunId);
      setStatus("SYNCING");
    }
  }, [initialRunId]);

  useEffect(() => {
    if (error || jobStatus === "FAILED") {
      setStatus("FAILED");
    } else if (jobStatus === "COMPLETED") {
      setStatus("COMPLETED");
    } else if (jobStatus === "EXECUTING" || jobStatus === "QUEUED") {
      setStatus("SYNCING");
    }
  }, [error, jobStatus]);

  return {
    status,
    setStatus,
    result: output,
  };
}
