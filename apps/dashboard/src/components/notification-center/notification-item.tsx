"use client";

import {
  type Activity,
  getMetadata,
  getMetadataProperty,
} from "@/hooks/use-notifications";
import { useUserQuery } from "@/hooks/use-user";
import { useI18n } from "@/locales/client";
import { Button } from "@zeke/ui/button";
import { cn } from "@zeke/ui/cn";
import { Icons } from "@zeke/ui/icons";
import { formatDistanceToNow } from "date-fns";
import {
  MdDescription,
  MdOutlineStyle,
  MdOutlineMenuBook,
  MdOutlineTask,
  MdOutlineAccountBalance,
} from "react-icons/md";
import { getNotificationDescription } from "./notification-descriptions";
import { NotificationLink } from "./notification-link";

interface NotificationItemProps {
  id: string;
  setOpen: (open: boolean) => void;
  activity: Activity;
  markMessageAsRead?: (id: string) => void;
}

export function NotificationItem({
  id,
  setOpen,
  activity,
  markMessageAsRead,
}: NotificationItemProps) {
  const t = useI18n();
  const { data: user } = useUserQuery();

  const recordId = getMetadataProperty(activity, "recordId");
  const metadata = getMetadata(activity);

  const getNotificationIcon = (activityType: string) => {
    if (activityType.startsWith("story_"))
      return <MdDescription className="size-4" />;
    if (activityType.startsWith("highlight_"))
      return <MdOutlineStyle className="size-4" />;
    if (activityType.startsWith("playbook_"))
      return <MdOutlineMenuBook className="size-4" />;
    if (activityType.startsWith("goal_"))
      return <MdOutlineTask className="size-4" />;
    if (activityType.startsWith("subscription_"))
      return <MdOutlineAccountBalance className="size-4" />;
    return <Icons.Notifications className="size-4" />;
  };

  const description = getNotificationDescription(
    activity.type,
    metadata,
    user,
    t,
  );

  const notificationContent = (
    <>
      <div>
        <div className="h-9 w-9 flex items-center justify-center space-y-0 border rounded-full">
          {getNotificationIcon(activity.type)}
        </div>
      </div>
      <div>
        <p
          className={cn(
            "text-sm",
            activity.status === "unread" && "font-medium",
          )}
        >
          {description}
        </p>
        <span className="text-xs text-[#606060]">
          {formatDistanceToNow(new Date(activity.createdAt))} ago
        </span>
      </div>
    </>
  );

  const actionButton = markMessageAsRead && (
    <div>
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full bg-transparent dark:hover:bg-[#1A1A1A] hover:bg-[#F6F6F3]"
        onClick={() => markMessageAsRead(id)}
        title="Archive notification"
      >
        <Icons.Inventory2 />
      </Button>
    </div>
  );

  return (
    <NotificationLink
      activityType={activity.type}
      recordId={recordId}
      metadata={metadata}
      onNavigate={() => setOpen(false)}
      className="flex items-between space-x-4 flex-1 text-left"
      actionButton={actionButton}
    >
      {notificationContent}
    </NotificationLink>
  );
}
