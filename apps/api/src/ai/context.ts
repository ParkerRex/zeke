import { AsyncLocalStorage } from "node:async_hooks";
import type { Database } from "@db/client";
import type { ChatUserContext } from "@zeke/cache/chat-cache";

interface ChatContext {
  db: Database;
  user: ChatUserContext;
  writer?: unknown;
}

const storage = new AsyncLocalStorage<ChatContext>();

// Global context storage for cases where we can't use AsyncLocalStorage
let globalContext: ChatContext | null = null;

export function setContext(context: ChatContext): void;
export function setContext<T>(context: ChatContext, fn: () => T): T;
export function setContext<T>(context: ChatContext, fn?: () => T): T | void {
  if (fn) {
    return storage.run(context, fn);
  }
  globalContext = context;
}

export function getContext(): ChatContext {
  const context = storage.getStore() ?? globalContext;
  if (!context) {
    throw new Error("Context not set. Make sure to call setContext first.");
  }
  return context;
}

export type { ChatUserContext };
