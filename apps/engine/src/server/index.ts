import { getEngineEnv } from "@zeke/utils/env";
import { createServer } from "./server";

// Validate environment at startup - fail fast if invalid
const env = getEngineEnv();
const port = env.PORT ?? 3010;

createServer()
  .then((server) => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`[engine] listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start engine server", error);
    process.exit(1);
  });
