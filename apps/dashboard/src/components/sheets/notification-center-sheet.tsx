"use client";

import { useModalParams } from "@/hooks/use-modal-params";
import { Button } from "@zeke/ui/button";
import { ScrollArea } from "@zeke/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@zeke/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zeke/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

/**
 * Notification Center Sheet - View system notifications and activity
 * Replaces invoice/transaction notifications with research activity
 */
export function NotificationCenterSheet() {
  const { notifications, closeNotifications } = useModalParams();
  const [activeTab, setActiveTab] = useState("all");
  const isOpen = Boolean(notifications);

  // Mock notifications - in production these would come from the API
  const notificationItems = [
    {
      id: "1",
      type: "insight",
      icon: Sparkles,
      title: "New insight discovered",
      description: "Found 3 new insights related to your AI Development goal",
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      category: "insights",
    },
    {
      id: "2",
      type: "playbook",
      icon: CheckCircle2,
      title: "Playbook completed",
      description: "Weekly Digest playbook finished successfully",
      time: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
      category: "activity",
    },
    {
      id: "3",
      type: "ingestion",
      icon: Zap,
      title: "Source ingested",
      description: "Successfully processed 5 URLs from your queue",
      time: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: true,
      category: "system",
    },
    {
      id: "4",
      type: "trending",
      icon: TrendingUp,
      title: "Trending story alert",
      description: "New story matching your interests is trending",
      time: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      category: "insights",
    },
  ];

  const filteredNotifications = notificationItems.filter(
    (item) => activeTab === "all" || item.category === activeTab,
  );

  const unreadCount = notificationItems.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    // In production, this would call an API endpoint
    console.log("Marking all as read");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeNotifications()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </h2>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[calc(100vh-240px)]" hideScrollbar>
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No notifications to show
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full p-4 rounded-lg border text-left transition-colors hover:bg-accent/50 ${
                          !item.read
                            ? "bg-accent/20 border-primary/20"
                            : "border-border"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`mt-1 p-2 rounded-full ${
                              item.type === "insight"
                                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                                : item.type === "playbook"
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                                  : item.type === "ingestion"
                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                                    : "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium">
                                {item.title}
                              </p>
                              {!item.read && (
                                <span className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(item.time, {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="outline"
            onClick={closeNotifications}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
