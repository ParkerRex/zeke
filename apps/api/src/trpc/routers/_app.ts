import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { assistantRouter } from "./assistant";
import { highlightRouter } from "./highlight";
import { searchRouter } from "./search";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { storyRouter } from "./story";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  assistant: assistantRouter,
  tags: tagsRouter,
  team: teamRouter,
  highlight: highlightRouter,
  story: storyRouter,
  user: userRouter,
  search: searchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
