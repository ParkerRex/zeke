"use client";

import { createContext, useContext, useMemo } from "react";

import type { Message } from "@ai-sdk/react";

type ChatContextValue = {
  messages: Message[];
};

const ChatContext = createContext<ChatContextValue>({ messages: [] });

type ProviderProps = {
  children: React.ReactNode;
  initialMessages?: Message[] | null;
};

export function ChatProvider({ children, initialMessages }: ProviderProps) {
  const value = useMemo<ChatContextValue>(() => {
    return {
      messages: initialMessages ?? [],
    };
  }, [initialMessages]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useMessages() {
  return useContext(ChatContext);
}
