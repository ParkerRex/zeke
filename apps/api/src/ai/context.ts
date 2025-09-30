import { type BaseContext, createTypedContext } from "@ai-sdk-tools/artifacts";
import type { Database } from "@zeke/db/client";

export interface ChatUserContext {
  id: string;
  email: string;
  fullName?: string | null;
  teamId: string;
  role: "owner" | "admin" | "member" | "viewer";
  plan?: string;
}

interface ChatContext extends BaseContext {
  db: Database;
  user: ChatUserContext;
}

export const { setContext, getContext } = createTypedContext<ChatContext>();
