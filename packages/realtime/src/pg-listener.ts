import { Client } from "pg";
import { EventEmitter } from "events";
import type { RealtimePayload } from "./types";

export interface PgListenerOptions {
  connectionString: string;
  channels?: string[];
}

export class PgListener extends EventEmitter {
  private client: Client;
  private connected = false;
  private reconnecting = false;

  constructor(private options: PgListenerOptions) {
    super();
    this.client = new Client({
      connectionString: options.connectionString,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      await this.client.connect();
      this.connected = true;

      // Subscribe to table_changes channel
      await this.client.query("LISTEN table_changes");

      // Subscribe to any additional channels
      for (const channel of this.options.channels || []) {
        await this.client.query(`LISTEN ${channel}`);
      }

      this.client.on("notification", (msg) => {
        if (msg.channel === "table_changes" && msg.payload) {
          try {
            const payload: RealtimePayload = JSON.parse(msg.payload);
            this.emit("change", payload);
          } catch (error) {
            console.error("Failed to parse notification payload:", error);
          }
        } else if (msg.payload) {
          this.emit(msg.channel, msg.payload);
        }
      });

      this.client.on("error", (error) => {
        console.error("PostgreSQL listener error:", error);
        this.handleDisconnect();
      });

      this.client.on("end", () => {
        this.handleDisconnect();
      });

      console.log("PostgreSQL listener connected");
    } catch (error) {
      console.error("Failed to connect PostgreSQL listener:", error);
      throw error;
    }
  }

  private async handleDisconnect(): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.connected = false;

    console.log("PostgreSQL listener disconnected, attempting to reconnect...");

    // Exponential backoff reconnection
    let delay = 1000;
    const maxDelay = 30000;

    while (!this.connected) {
      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        this.client = new Client({
          connectionString: this.options.connectionString,
        });
        await this.connect();
        console.log("PostgreSQL listener reconnected");
        this.reconnecting = false;
        return;
      } catch (error) {
        console.error("Reconnection attempt failed:", error);
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
    }
  }
}

export async function createPgListener(
  connectionString: string,
): Promise<PgListener> {
  const listener = new PgListener({ connectionString });
  await listener.connect();
  return listener;
}
