"use client";
// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.

import type {
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { createClient } from "@zeke/supabase/client";
import type { Database } from "@zeke/supabase/types";
import { useEffect } from "react";

type PublicSchema = Database[Extract<keyof Database, "public">];
type Tables = PublicSchema["Tables"];
type TableName = keyof Tables;

interface UseRealtimeProps<TN extends TableName> {
  channelName: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  table: TN;
  filter?: string;
  onEvent: (payload: RealtimePostgresChangesPayload<Tables[TN]["Row"]>) => void;
}

export function useRealtime<TN extends TableName>({
  channelName,
  event = "*",
  table,
  filter,
  onEvent,
}: UseRealtimeProps<TN>) {
  const supabase: SupabaseClient = createClient();

  useEffect(() => {
    const filterConfig: RealtimePostgresChangesFilter<"*"> = {
      event: event as RealtimePostgresChangesFilter<"*">["event"],
      schema: "public",
      table,
      filter,
    };

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        filterConfig,
        (payload: RealtimePostgresChangesPayload<Tables[TN]["Row"]>) => {
          onEvent(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);
}
