"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { useModalParams } from "@/hooks/use-modal-params";
import { api } from "@/trpc/client";
import { Badge } from "@zeke/ui/badge";
import { Button } from "@zeke/ui/button";
import { cn } from "@zeke/ui/cn";
import { Bell, Link2, PlayCircle, Search, Sparkles } from "lucide-react";

/**
 * HeaderClient - Client components for the header
 * Uses bootstrap data from the workspace router
 */

export function QuickActions() {
  const { openSourceIntake, openPlaybookRun, openAssistant } = useModalParams();
  const { track } = useAnalytics();

  return (
    <div className="hidden md:flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          track("QuickActionTriggered", {
            action: "source-intake",
            source: "header",
          });
          openSourceIntake();
        }}
        className="text-xs"
      >
        <Link2 className="h-3.5 w-3.5 mr-1.5" />
        Add Source
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          track("QuickActionTriggered", {
            action: "playbook-run",
            source: "header",
          });
          openPlaybookRun();
        }}
        className="text-xs"
      >
        <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
        Run Playbook
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          track("QuickActionTriggered", {
            action: "assistant-open",
            source: "header",
          });
          openAssistant();
        }}
        className="text-xs"
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        Assistant
      </Button>
    </div>
  );
}

export function IngestionHealth() {
  // Pipeline health surface was retired with the Trigger.dev integration.
  return null;
}

export function NotificationBadge() {
  const { openNotifications } = useModalParams();

  // Get workspace data from context
  const { data: workspace } = api.workspace.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const unreadCount = workspace?.navCounts?.notifications || 0;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={openNotifications}
      className="relative"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

export function SearchTrigger() {
  const { setParams } = useModalParams();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setParams({ search: true })}
      className="hidden md:flex items-center gap-2 text-xs text-muted-foreground"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}

export function TrialStatus() {
  const { data: workspace } = api.workspace.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const team = workspace?.team;
  if (!team || team.subscriptionStatus !== "trialing") return null;

  const daysLeft = team.trialDaysLeft || 0;

  return (
    <Badge
      variant={daysLeft <= 3 ? "destructive" : "secondary"}
      className={cn("hidden md:inline-flex", daysLeft <= 3 && "animate-pulse")}
    >
      {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in trial
    </Badge>
  );
}
