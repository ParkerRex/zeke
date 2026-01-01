import { AsyncLocalStorage } from "node:async_hooks";
import type { Database } from "@db/client";
import type { ChatUserContext } from "@zeke/cache/chat-cache";

interface ChatContext {
  db: Database;
  user: ChatUserContext;
}

const storage = new AsyncLocalStorage<ChatContext>();

export function setContext<T>(context: ChatContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getContext(): ChatContext {
  const context = storage.getStore();
  if (!context) {
    throw new Error("Context not set. Make sure to call setContext first.");
  }
  return context;
}

export type { ChatUserContext };
