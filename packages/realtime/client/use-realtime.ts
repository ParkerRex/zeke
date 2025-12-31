"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type RealtimeOperation = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeProps<T> {
  channelName: string;
  table: string;
  filter?: string;
  event?: RealtimeOperation;
  onEvent: (payload: { event: string; payload: T }) => void;
  enabled?: boolean;
}

interface WebSocketMessage {
  type: string;
  table?: string;
  event?: string;
  payload?: any;
  clientId?: string;
}

export function useRealtime<T>({
  channelName,
  table,
  filter,
  event = "*",
  onEvent,
  enabled = true,
}: UseRealtimeProps<T>) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const onEventRef = useRef(onEvent);

  // Keep callback ref up to date
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(async () => {
    if (!enabled) return;

    const wsUrl = process.env.NEXT_PUBLIC_REALTIME_WS_URL;
    if (!wsUrl) {
      console.warn("NEXT_PUBLIC_REALTIME_WS_URL not configured");
      return;
    }

    // Get access token from session (implement based on your auth)
    // For now, use a placeholder
    const token = ""; // await getAccessToken();

    try {
      const ws = new WebSocket(`${wsUrl}?token=${token}`);

      ws.onopen = () => {
        console.log(`Realtime connected to ${channelName}`);
        setIsConnected(true);

        // Subscribe to the channel
        ws.send(
          JSON.stringify({
            type: "subscribe",
            table,
            filter,
            event,
          }),
        );
      };

      ws.onmessage = (messageEvent) => {
        try {
          const data: WebSocketMessage = JSON.parse(messageEvent.data);

          if (data.type === "postgres_changes" && data.table === table) {
            if (event === "*" || data.event === event) {
              onEventRef.current({
                event: data.event || "",
                payload: data.payload,
              });
            }
          }
        } catch (error) {
          console.error("Failed to parse realtime message:", error);
        }
      };

      ws.onclose = () => {
        console.log(`Realtime disconnected from ${channelName}`);
        setIsConnected(false);

        // Attempt to reconnect after 3 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("Realtime WebSocket error:", error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to connect to realtime:", error);
    }
  }, [enabled, channelName, table, filter, event]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        // Unsubscribe before closing
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "unsubscribe",
              channel: `${table}:${filter || "*"}:${event}`,
            }),
          );
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, table, filter, event]);

  return { isConnected };
}
