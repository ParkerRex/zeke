import http from "node:http";
import { URL } from "node:url";
import { getEngineEnv } from "@zeke/utils/env";
import { createProvider } from "../providers";
import type { ProviderFacade } from "../providers";

function buildEnv(): ProviderFacade {
  // Validate environment variables at startup - will fail fast if invalid
  const env = getEngineEnv();

  const provider = createProvider({
    API_SECRET_KEY: env.API_SECRET_KEY,
    YOUTUBE_API_KEY: env.YOUTUBE_API_KEY ?? "",
    YOUTUBE_QUOTA_LIMIT: env.YOUTUBE_QUOTA_LIMIT ?? "0",
    YOUTUBE_QUOTA_RESET_HOUR: env.YOUTUBE_QUOTA_RESET_HOUR ?? "0",
    YOUTUBE_RATE_LIMIT_BUFFER: env.YOUTUBE_RATE_LIMIT_BUFFER ?? "0",
  });

  return provider;
}

export async function createServer() {
  const provider = buildEnv();

  const server = http.createServer(async (req, res) => {
    try {
      const env = getEngineEnv();
      const requestUrl = new URL(
        req.url ?? "",
        `http://localhost:${env.PORT ?? 3010}`,
      );

      if (req.method === "GET" && requestUrl.pathname === "/health") {
        const health = await provider.getHealthCheck();
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ok", providers: health }));
        return;
      }

      if (req.method === "POST" && requestUrl.pathname === "/ingest") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body ?? "{}");
            if (!payload?.url) {
              res.writeHead(400, { "content-type": "application/json" });
              res.end(JSON.stringify({ error: "Missing url" }));
              return;
            }

            const content = await provider.getContent(payload.url);
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ data: content }));
          } catch (error) {
            console.error("ingest-error", error);
            res.writeHead(500, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to ingest content" }));
          }
        });
        return;
      }

      if (req.method === "POST" && requestUrl.pathname === "/source") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body ?? "{}");
            if (!payload?.url) {
              res.writeHead(400, { "content-type": "application/json" });
              res.end(JSON.stringify({ error: "Missing url" }));
              return;
            }

            const source = await provider.getSource(payload.url);
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ data: source }));
          } catch (error) {
            console.error("source-error", error);
            res.writeHead(500, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to fetch source" }));
          }
        });
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === "/") {
        res.writeHead(302, { Location: "https://zekehq.com" });
        res.end();
        return;
      }

      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      console.error("request-error", error);
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  });

  return server;
}
