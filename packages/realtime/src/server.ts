import { WebSocketServer, WebSocket } from "ws";
import { createPgListener, type PgListener } from "./pg-listener";
import type {
  ClientSubscription,
  RealtimePayload,
  SubscribeMessage,
  UnsubscribeMessage,
  ServerConfig,
} from "./types";

const clients = new Map<
  string,
  { ws: WebSocket; subscription: ClientSubscription }
>();

async function verifyToken(
  token: string | undefined,
  jwtSecret?: string,
): Promise<{ id: string } | null> {
  if (!token) return null;

  // For now, simple token validation
  // In production, use jose or jsonwebtoken to verify JWT
  try {
    // Basic auth: expect token format "userId:signature"
    // Replace with proper JWT verification
    if (token.includes(":")) {
      const [userId] = token.split(":");
      return { id: userId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createRealtimeServer(
  config: ServerConfig,
): Promise<void> {
  const { port, databaseUrl, jwtSecret } = config;

  // Create PostgreSQL listener
  let pgListener: PgListener;
  try {
    pgListener = await createPgListener(databaseUrl);
  } catch (error) {
    console.error("Failed to create PostgreSQL listener:", error);
    throw error;
  }

  // Create WebSocket server
  const wss = new WebSocketServer({ port });

  console.log(`Realtime WebSocket server listening on port ${port}`);

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://localhost:${port}`);
    const token =
      url.searchParams.get("token") || req.headers.authorization?.split(" ")[1];

    const user = await verifyToken(token, jwtSecret);

    if (!user) {
      ws.close(1008, "Unauthorized");
      return;
    }

    const clientId = crypto.randomUUID();
    clients.set(clientId, {
      ws,
      subscription: {
        userId: user.id,
        channels: new Set(),
      },
    });

    console.log(`Client connected: ${clientId} (user: ${user.id})`);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "subscribe") {
          const { table, filter, event = "*" } = message as SubscribeMessage;
          const channel = `${table}:${filter || "*"}:${event}`;
          const client = clients.get(clientId);
          if (client) {
            client.subscription.channels.add(channel);
            console.log(`Client ${clientId} subscribed to ${channel}`);
          }
        }

        if (message.type === "unsubscribe") {
          const { channel } = message as UnsubscribeMessage;
          const client = clients.get(clientId);
          if (client) {
            client.subscription.channels.delete(channel);
            console.log(`Client ${clientId} unsubscribed from ${channel}`);
          }
        }

        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    });

    ws.on("close", () => {
      clients.delete(clientId);
      console.log(`Client disconnected: ${clientId}`);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
    });

    // Send connection acknowledgment
    ws.send(JSON.stringify({ type: "connected", clientId }));
  });

  // Broadcast database changes to subscribed clients
  pgListener.on("change", (payload: RealtimePayload) => {
    const { table, operation, record } = payload;

    for (const [clientId, { ws, subscription }] of clients) {
      const channels = subscription.channels;

      // Check if client is subscribed to this table
      const matchingChannel =
        channels.has(`${table}:*:*`) ||
        channels.has(`${table}:*:${operation}`) ||
        channels.has(`${table}:${record.id}:*`) ||
        channels.has(`${table}:${record.id}:${operation}`);

      if (matchingChannel) {
        try {
          ws.send(
            JSON.stringify({
              type: "postgres_changes",
              table,
              event: operation,
              payload: record,
            }),
          );
        } catch (error) {
          console.error(`Failed to send to client ${clientId}:`, error);
        }
      }
    }
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("Shutting down realtime server...");
    await pgListener.disconnect();
    wss.close();
    process.exit(0);
  });
}

// Start server if run directly
if (import.meta.main) {
  const port = parseInt(process.env.REALTIME_PORT || "8080", 10);
  const databaseUrl = process.env.DATABASE_PRIMARY_URL;
  const jwtSecret = process.env.AUTH_SECRET;

  if (!databaseUrl) {
    console.error("DATABASE_PRIMARY_URL is required");
    process.exit(1);
  }

  createRealtimeServer({ port, databaseUrl, jwtSecret });
}
