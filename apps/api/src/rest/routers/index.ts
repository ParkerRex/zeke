import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { protectedMiddleware } from "../middleware";
import { chatRouter } from "./chat";
import { highlightsRouter } from "./highlights";
import { notificationsRouter } from "./notifications";
import oauthRouter from "./oauth";
import { searchRouter } from "./search";
import { storiesRouter } from "./stories";
import { tagsRouter } from "./tags";
import { teamsRouter } from "./teams";
import { transcriptionRouter } from "./transcription";
import { triggerRouter } from "./trigger";
import { usersRouter } from "./users";

const routers = new OpenAPIHono<Context>();

// Mount OAuth routes first (publicly accessible)
routers.route("/oauth", oauthRouter);

// Apply protected middleware to all subsequent routes
routers.use(...protectedMiddleware);

// Mount protected routes
routers.route("/highlights", highlightsRouter);
routers.route("/notifications", notificationsRouter);
routers.route("/teams", teamsRouter);
routers.route("/stories", storiesRouter);
routers.route("/users", usersRouter);
routers.route("/tags", tagsRouter);
routers.route("/search", searchRouter);
routers.route("/chat", chatRouter);
routers.route("/transcription", transcriptionRouter);
routers.route("/trigger", triggerRouter);

export { routers };
