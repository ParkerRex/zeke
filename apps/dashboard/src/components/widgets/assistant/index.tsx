"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { useModalParams } from "@/hooks/use-modal-params";
import { api } from "@/trpc/client";
import { Badge } from "@zeke/ui/badge";
import { Button } from "@zeke/ui/button";
import { cn } from "@zeke/ui/cn";
import { Input } from "@zeke/ui/input";
import { Skeleton } from "@zeke/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Clock, MessageSquare, Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType, FormEvent } from "react";
import { useId, useMemo, useState } from "react";

const DEFAULT_PROMPTS = [
  "What are the top insights this week?",
  "Summarize recent highlights about AI developments",
  "Help me create a competitive analysis playbook",
];

type AssistantSummary = {
  messageCount30d: number;
  lastChatDate: string | Date | null;
  suggestedPrompts?: string[];
  recentChatIds?: string[];
};

type ChatListItem = {
  id: string;
  title: string;
  updatedAt: string | Date;
  messageCount: number;
};

/**
 * Assistant widget – provides a quick entry point into the conversational research assistant
 * Surfaces recent activity, suggested prompts, and shortcuts into existing conversations.
 */
export function Assistant() {
  const router = useRouter();
  const { openAssistant } = useModalParams();
  const { track } = useAnalytics();
  const [question, setQuestion] = useState("");

  const { data: workspace, isLoading: workspaceLoading } =
    api.workspace.get.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
    });

  const { data: chats, isLoading: chatsLoading } = api.chats.list.useQuery(
    { limit: 4, orderBy: "recent" },
    { staleTime: 60 * 1000 },
  );

  const assistantSummary: AssistantSummary | undefined =
    workspace?.assistantSummary;

  const prompts = useMemo(() => {
    if (assistantSummary?.suggestedPrompts?.length) {
      return assistantSummary.suggestedPrompts.slice(0, 3);
    }
    return DEFAULT_PROMPTS;
  }, [assistantSummary?.suggestedPrompts]);

  const recentChats: ChatListItem[] = useMemo(() => {
    if (!chats?.items?.length) return [];
    return chats.items.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      updatedAt: item.updatedAt,
      messageCount: item.messageCount ?? 0,
    }));
  }, [chats?.items]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = question.trim();
    if (!value) return;

    track("QuickActionTriggered", {
      action: "assistant-open",
      source: "menu",
    });

    openAssistant(undefined, value);
    setQuestion("");
  };

  const handlePromptSelect = (prompt: string) => {
    track("QuickActionTriggered", {
      action: "assistant-open",
      source: "menu",
    });
    openAssistant(undefined, prompt);
  };

  const handleOpenAssistant = () => {
    track("QuickActionTriggered", {
      action: "assistant-open",
      source: "menu",
    });
    openAssistant();
  };

  const handleContinueChat = (chatId: string) => {
    track("QuickActionTriggered", {
      action: "assistant-open",
      source: "menu",
    });
    openAssistant(chatId);
    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="border aspect-square overflow-hidden relative p-4 md:p-8">
      <div className="flex h-full flex-col gap-6">
        <AssistantHeader
          summary={assistantSummary}
          loading={workspaceLoading}
          onOpenAssistant={handleOpenAssistant}
        />

        <AssistantInput
          value={question}
          onChange={setQuestion}
          onSubmit={handleSubmit}
        />

        <AssistantPrompts
          prompts={prompts}
          loading={workspaceLoading}
          onSelect={handlePromptSelect}
        />

        <AssistantRecents
          chats={recentChats}
          loading={chatsLoading}
          onContinue={handleContinueChat}
        />
      </div>
    </div>
  );
}

type AssistantHeaderProps = {
  summary?: AssistantSummary;
  loading?: boolean;
  onOpenAssistant: () => void;
};

function AssistantHeader({
  summary,
  loading,
  onOpenAssistant,
}: AssistantHeaderProps) {
  const messagesLast30d = summary?.messageCount30d ?? 0;
  const lastChatAgo = summary?.lastChatDate
    ? formatRelative(summary.lastChatDate)
    : "No chats yet";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Assistant</h2>
          <Badge variant="secondary">Research Copilot</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask questions, explore insights, and launch research playbooks.
        </p>
      </div>

      <div className="flex flex-col gap-2 min-w-[180px]">
        <AssistantStat
          icon={MessageSquare}
          label="Messages (30d)"
          value={messagesLast30d.toString()}
          loading={loading}
        />
        <AssistantStat
          icon={Clock}
          label="Last chat"
          value={lastChatAgo}
          loading={loading}
        />
        <Button variant="outline" size="sm" onClick={onOpenAssistant}>
          Open assistant
        </Button>
      </div>
    </div>
  );
}

type AssistantStatProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  loading?: boolean;
};

function AssistantStat({
  icon: Icon,
  label,
  value,
  loading,
}: AssistantStatProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {loading ? (
          <Skeleton className="mt-1 h-4 w-12" />
        ) : (
          <span className="mt-1 text-sm font-medium">{value}</span>
        )}
      </div>
    </div>
  );
}

type AssistantInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function AssistantInput({ value, onChange, onSubmit }: AssistantInputProps) {
  const inputId = useId();

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-xs font-medium uppercase text-muted-foreground"
      >
        Jump back in
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask about stories, highlights, or next steps..."
          className="flex-1"
        />
        <Button type="submit" disabled={!value.trim()}>
          <Send className="mr-2 h-4 w-4" />
          Ask
        </Button>
      </div>
    </form>
  );
}

type AssistantPromptsProps = {
  prompts: string[];
  loading?: boolean;
  onSelect: (prompt: string) => void;
};

function AssistantPrompts({
  prompts,
  loading,
  onSelect,
}: AssistantPromptsProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">
        Suggested prompts
      </p>
      {loading ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              variant="secondary"
              size="sm"
              className={cn("justify-start whitespace-normal text-left")}
              onClick={() => onSelect(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

type AssistantRecentsProps = {
  chats: ChatListItem[];
  loading?: boolean;
  onContinue: (chatId: string) => void;
};

function AssistantRecents({
  chats,
  loading,
  onContinue,
}: AssistantRecentsProps) {
  return (
    <div className="flex-1">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        Recent conversations
      </p>
      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : chats.length ? (
        <ul className="mt-3 space-y-2">
          {chats.map((chat) => (
            <li
              key={chat.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium line-clamp-1">{chat.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelative(chat.updatedAt)} • {chat.messageCount}{" "}
                  messages
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onContinue(chat.id)}
              >
                Continue
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
          Start your first conversation to see it appear here.
        </div>
      )}
    </div>
  );
}

function formatRelative(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return formatDistanceToNow(date, { addSuffix: true });
}
