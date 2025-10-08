import { createServer } from "./server";

const port = Number(process.env.PORT ?? 3010);

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
