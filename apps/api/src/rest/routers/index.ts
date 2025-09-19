import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { assistantRouter } from "./assistant";
import { highlightsRouter } from "./highlights";
import { searchRouter } from "./search";
import { storiesRouter } from "./stories";
import { tagsRouter } from "./tags";
import { teamsRouter } from "./teams";
import { usersRouter } from "./users";

const routers = new OpenAPIHono<Context>({
  strict: false,
});

routers.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Zeke API",
    version: "1.0.0",
    description:
      "REST surface for Zeke demos, backed by shared TRPC schemas and Supabase auth.",
  },
  servers: [
    {
      url: "/api",
      description: "Default API entry point",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
});

routers.route("/assistant", assistantRouter);
routers.route("/stories", storiesRouter);
routers.route("/highlights", highlightsRouter);
routers.route("/search", searchRouter);
routers.route("/tags", tagsRouter);
routers.route("/teams", teamsRouter);
routers.route("/users", usersRouter);

export { routers };
