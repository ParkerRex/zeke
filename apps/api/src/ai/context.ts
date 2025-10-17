import { type BaseContext, createTypedContext } from "@ai-sdk-tools/artifacts";
import type { Database } from "@db/client";
import type { ChatUserContext } from "@zeke/cache/chat-cache";

interface ChatContext extends BaseContext {
  db: Database;
  user: ChatUserContext;
}

export const { setContext, getContext } = createTypedContext<ChatContext>();
export type { ChatUserContext };
