import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { Bindings } from "./common/bindings";
import { createProvider } from "./providers";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// Security middleware
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: "*", // Allow all origins for content ingestion
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check
app.get("/health", async (c) => {
  try {
    const provider = createProvider(c.env);
    const healthStatus = await provider.getHealthCheck();

    const allHealthy = Object.values(healthStatus).every(
      (status) => status.status === "healthy",
    );

    return c.json({
      status: allHealthy ? "healthy" : "degraded",
      providers: healthStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

// Content ingestion endpoint
app.post("/ingest", async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url || typeof url !== "string") {
      return c.json({ error: "URL is required" }, 400);
    }

    const provider = createProvider(c.env);
    const content = await provider.getContent(url);

    return c.json({
      data: content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to ingest content",
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }
});

// Source information endpoint
app.post("/source", async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url || typeof url !== "string") {
      return c.json({ error: "URL is required" }, 400);
    }

    const provider = createProvider(c.env);
    const source = await provider.getSource(url);

    return c.json({
      data: source,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get source info",
        timestamp: new Date().toISOString(),
      },
      400,
    );
  }
});

// Root redirect
app.get("/", (c) => {
  return c.redirect("https://zekehq.com");
});

export default app;
export type AppType = typeof app;
