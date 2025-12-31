"use client";

import { authClient } from "@zeke/auth/client";
import { useCallback, useEffect, useRef, useState } from "react";

export type JobStatusType =
  | "QUEUED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

interface JobStatusUpdate {
  id: string;
  status: JobStatusType;
  taskId?: string;
  output?: unknown;
  completedOn?: string | null;
}

interface UseJobStatusProps {
  runId?: string;
  enabled?: boolean;
}

interface UseJobStatusReturn {
  status: JobStatusType | null;
  output: unknown | null;
  error: Error | null;
  isConnected: boolean;
}

export function useJobStatus({
  runId,
  enabled = true,
}: UseJobStatusProps): UseJobStatusReturn {
  const [status, setStatus] = useState<JobStatusType | null>(null);
  const [output, setOutput] = useState<unknown | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const connect = useCallback(async () => {
    if (!runId || !enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const session = await authClient.getSession();
      const token = session?.data?.session?.token;

      if (!token) {
        setError(new Error("No auth token available"));
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setError(new Error("API URL not configured"));
        return;
      }

      // For SSE with auth, we need to use fetch with ReadableStream
      // since EventSource doesn't support custom headers
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${apiUrl}/jobs/stream/${runId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError(new Error("Job not found"));
        } else {
          setError(new Error(`Failed to connect: ${response.status}`));
        }
        return;
      }

      setIsConnected(true);
      setError(null);

      const reader = response.body?.getReader();
      if (!reader) {
        setError(new Error("No response body"));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (line.startsWith("event:")) {
            const eventType = line.slice(6).trim();
            const nextLine = lines[i + 1];

            if (nextLine?.startsWith("data:")) {
              const dataStr = nextLine.slice(5).trim();

              if (eventType === "status" && dataStr) {
                try {
                  const data: JobStatusUpdate = JSON.parse(dataStr);
                  setStatus(data.status);
                  if (data.output !== undefined) {
                    setOutput(data.output);
                  }
                } catch {
                  console.error("Failed to parse job status:", dataStr);
                }
              } else if (eventType === "error" && dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  setError(new Error(data.error || "Unknown error"));
                } catch {
                  setError(new Error(dataStr));
                }
              } else if (eventType === "close") {
                setIsConnected(false);
                return;
              } else if (eventType === "timeout") {
                setError(new Error("Connection timeout"));
                setIsConnected(false);
                return;
              }

              i++; // Skip the data line we just processed
            }
          }
        }
      }

      setIsConnected(false);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Connection was intentionally aborted
        return;
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnected(false);
    }
  }, [runId, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect]);

  return { status, output, error, isConnected };
}
