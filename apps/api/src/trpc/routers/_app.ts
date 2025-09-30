import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { assistantRouter } from "./assistant";
import { chatsRouter } from "./chats";
import { highlightRouter } from "./highlight";
import { insightsRouter } from "./insights";
import { pipelineRouter } from "./pipeline";
import { searchRouter } from "./search";
import { storiesRouter } from "./stories";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { userRouter } from "./user";
import { workspaceRouter } from "./workspace";

export const appRouter = createTRPCRouter({
  assistant: assistantRouter,
  chats: chatsRouter,
  tags: tagsRouter,
  team: teamRouter,
  highlight: highlightRouter,
  insights: insightsRouter,
  stories: storiesRouter,
  user: userRouter,
  search: searchRouter,
  pipeline: pipelineRouter,
  workspace: workspaceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
