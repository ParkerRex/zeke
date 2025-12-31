"use client";

import { useEffect, useState } from "react";
import { useJobStatus } from "./use-job-status";

type UseExportStatusProps = {
  runId?: string;
  accessToken?: string; // Kept for API compatibility but not used (uses session auth)
};

export function useExportStatus({
  runId: initialRunId,
}: UseExportStatusProps = {}) {
  const [runId, setRunId] = useState<string | undefined>(initialRunId);
  const [status, setStatus] = useState<
    "FAILED" | "IN_PROGRESS" | "COMPLETED" | null
  >(null);
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<unknown>(null);

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
      setStatus("IN_PROGRESS");
    }
  }, [initialRunId]);

  useEffect(() => {
    if (error || jobStatus === "FAILED") {
      setStatus("FAILED");
      setProgress(0);
    } else if (jobStatus === "COMPLETED") {
      setStatus("COMPLETED");
      setProgress(100);
    } else if (jobStatus === "EXECUTING" || jobStatus === "QUEUED") {
      setStatus("IN_PROGRESS");
    }
  }, [error, jobStatus]);

  useEffect(() => {
    if (output) {
      setResult(output);
    }
  }, [output]);

  return {
    status,
    setStatus,
    progress,
    result,
  };
}
