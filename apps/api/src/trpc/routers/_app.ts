import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { apiKeysRouter } from "./api-keys";
import { appsRouter } from "./apps";
import { billingRouter } from "./billing";
import { chatsRouter } from "./chats";
import { chatFeedbackRouter } from "./feedback";
import { highlightRouter } from "./highlight";
import { notificationSettingsRouter } from "./notification-settings";
import { notificationsRouter } from "./notifications";
import { oauthApplicationsRouter } from "./oauth-applications";
import { triggerRouter } from "./trigger";
import { searchRouter } from "./search";
import { storiesRouter } from "./stories";
import { suggestedActionsRouter } from "./suggested-actions";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  notifications: notificationsRouter,
  notificationSettings: notificationSettingsRouter,
  apps: appsRouter,
  billing: billingRouter,
  chats: chatsRouter,
  team: teamRouter,
  chatFeedback: chatFeedbackRouter,
  highlight: highlightRouter,
  stories: storiesRouter,
  user: userRouter,
  suggestedActions: suggestedActionsRouter,
  oauthApplications: oauthApplicationsRouter,
  search: searchRouter,
  tags: tagsRouter,
  trigger: triggerRouter,
  apiKeys: apiKeysRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
