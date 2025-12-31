export type RealtimeOperation = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimePayload<T = any> {
  table: string;
  operation: RealtimeOperation;
  record: T;
  old_record?: T;
}

export interface RealtimeEvent {
  type: "postgres_changes";
  table: string;
  event: RealtimeOperation;
  payload: any;
}

export interface SubscribeMessage {
  type: "subscribe";
  table: string;
  filter?: string;
  event?: RealtimeOperation | "*";
}

export interface UnsubscribeMessage {
  type: "unsubscribe";
  channel: string;
}

export interface ClientSubscription {
  userId: string;
  channels: Set<string>;
}

export interface ServerConfig {
  port: number;
  databaseUrl: string;
  jwtSecret?: string;
}
