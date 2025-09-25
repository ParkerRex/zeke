import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { assistantRouter } from "./assistant";
import { highlightRouter } from "./highlight";
import { pipelineRouter } from "./pipeline";
import { searchRouter } from "./search";
import { storiesRouter } from "./stories";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  assistant: assistantRouter,
  tags: tagsRouter,
  team: teamRouter,
  highlight: highlightRouter,
  stories: storiesRouter,
  user: userRouter,
  search: searchRouter,
  pipeline: pipelineRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
