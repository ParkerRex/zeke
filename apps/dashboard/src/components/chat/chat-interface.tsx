"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { useMessages } from "@/lib/chat-store";
import { api } from "@/trpc/client";
import { useChat } from "@ai-sdk/react";
import { Button } from "@zeke/ui/button";
import { ScrollArea } from "@zeke/ui/scroll-area";
import { Textarea } from "@zeke/ui/textarea";
import { useToast } from "@zeke/ui/use-toast";
import {
  ArrowRight,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatEmpty } from "./chat-empty";
import { ChatExamples } from "./chat-examples";
import { Messages } from "./messages";

interface ChatInterfaceProps {
  id?: string;
  geo?: {
    city?: string;
    country?: string;
    region?: string;
  };
}

/**
 * ChatInterface - Main chat UI component for the research assistant
 * Handles chat history, streaming responses, and example prompts
 */
export function ChatInterface({ id, geo }: ChatInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { track } = useAnalytics();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Get initial message from URL params if provided
  const initialMessage = searchParams.get("message");

  // Use the AI SDK tools store for message persistence
  const { messages: storedMessages } = useMessages();

  // TRPC mutations
  const createChat = api.chats.create.useMutation({
    onSuccess: (chat) => {
      router.push(`/${chat.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create chat",
        description: error.message,
        variant: "destructive",
      });
      setIsCreatingChat(false);
    },
  });

  const updateTitle = api.chats.updateTitle.useMutation();
  const sendFeedback = api.chats.feedback.useMutation();

  // Chat hook with streaming
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: submitChat,
    isLoading,
    reload,
    stop,
    setInput,
    append,
  } = useChat({
    api: "/api/chat",
    id,
    initialMessages: storedMessages,
    body: {
      chatId: id,
      geo,
    },
    onFinish: async (message) => {
      // Auto-generate title for new chats after first response
      if (!id && messages.length === 2) {
        const userMessage = messages[0]?.content;
        if (userMessage && typeof userMessage === "string") {
          const title = userMessage.substring(0, 50);
          updateTitle.mutate({ chatId: id!, title });
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Chat error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle initial message from URL
  useEffect(() => {
    if (initialMessage && !messages.length) {
      append({ role: "user", content: initialMessage });
      submitChat();
    }
  }, [initialMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Track assistant message sent
    track("AssistantMessageSent", {
      chatId: id || "new",
      messageLength: input.length,
      isFirstMessage: messages.length === 0,
      hasContext: !!geo,
    });

    // Create new chat if needed
    if (!id && !isCreatingChat) {
      setIsCreatingChat(true);
      const title = input.substring(0, 50);
      createChat.mutate({
        title,
        initialMessage: input,
      });
    } else {
      submitChat(e);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    // Auto-submit after a brief delay for UX
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  const handleFeedback = (messageId: string, type: "positive" | "negative") => {
    if (!id) return;

    // Track feedback event
    track("AssistantFeedbackSubmitted", {
      chatId: id,
      messageId,
      type,
      hasComment: false,
    });

    sendFeedback.mutate({
      chatId: id,
      messageId,
      type,
    });

    toast({
      title: "Feedback received",
      description: "Thank you for helping improve the assistant",
    });
  };

  // Example prompts for research context
  const examples = [
    "What are the top insights from this week?",
    "Summarize recent highlights about AI developments",
    "Find stories related to our product roadmap",
    "What playbooks should I run for competitive analysis?",
    "Show me trending topics in our industry",
  ];

  const showExamples = messages.length === 0 && !input;
  const showEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Location indicator */}
      {geo && (
        <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-1 border-b">
          <MapPin className="h-3 w-3" />
          {geo.city}, {geo.region}, {geo.country}
        </div>
      )}

      {/* Messages area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
        {showEmpty ? (
          <div className="py-8">
            <ChatEmpty />
            {showExamples && (
              <ChatExamples
                examples={examples}
                onExampleClick={handleExampleClick}
              />
            )}
          </div>
        ) : (
          <Messages
            messages={messages}
            isLoading={isLoading}
            onFeedback={handleFeedback}
          />
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about insights, stories, or research tasks..."
              className="min-h-[80px] pr-24 resize-none"
              disabled={isLoading || isCreatingChat}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute bottom-2 right-2 flex gap-2">
              {isLoading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={stop}
                  disabled={!isLoading}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Stop
                </Button>
              )}
              {!isLoading && messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={reload}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading || isCreatingChat}
              >
                {isLoading || isCreatingChat ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Powered by GPT-4</span>
            </div>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </form>
      </div>
    </div>
  );
}
