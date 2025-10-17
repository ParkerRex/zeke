"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

const SUPPORTED_NOTIFICATION_TYPES = [
  "story_published",
  "story_pinned",
  "highlight_created",
  "highlight_pinned",
  "playbook_created",
  "playbook_published",
  "goal_created",
  "goal_completed",
  "subscription_upgraded",
  "subscription_downgraded",
];

export function isNotificationClickable(activityType: string): boolean {
  return SUPPORTED_NOTIFICATION_TYPES.includes(activityType);
}

interface NotificationLinkProps {
  activityType: string;
  recordId: string | null | undefined;
  metadata?: Record<string, any>;
  onNavigate?: () => void;
  children: ReactNode;
  className?: string;
  actionButton?: ReactNode;
}

export function NotificationLink({
  activityType,
  recordId,
  metadata,
  onNavigate,
  children,
  className,
  actionButton,
}: NotificationLinkProps) {
  const router = useRouter();

  const isClickable = isNotificationClickable(activityType);

  const handleClick = () => {
    onNavigate?.();

    try {
      switch (activityType) {
        case "story_published":
        case "story_pinned":
          if (recordId) {
            router.push(`/story/${recordId}`);
          } else {
            router.push("/stories");
          }
          break;

        case "highlight_created":
        case "highlight_pinned":
          if (metadata?.storyId) {
            router.push(`/story/${metadata.storyId}#highlight-${recordId}`);
          } else if (recordId) {
            router.push(`/stories?highlight=${recordId}`);
          } else {
            router.push("/stories");
          }
          break;

        case "playbook_created":
        case "playbook_published":
          if (recordId) {
            router.push(`/playbooks/${recordId}`);
          } else {
            router.push("/playbooks");
          }
          break;

        case "goal_created":
        case "goal_completed":
          router.push("/today");
          break;

        case "subscription_upgraded":
        case "subscription_downgraded":
          router.push("/settings/billing");
          break;

        default:
          console.warn(`Unhandled notification type: ${activityType}`);
      }
    } catch (error) {
      console.error(`Error navigating for ${activityType}:`, error);
    }
  };

  if (isClickable) {
    return (
      <div className="flex items-between justify-between space-x-4 px-3 py-3 hover:bg-secondary">
        <button className={className} onClick={handleClick} type="button">
          {children}
        </button>
        {actionButton}
      </div>
    );
  }

  return (
    <div className="flex items-between space-x-4 px-3 py-3">
      <div className="flex items-between justify-between space-x-4 flex-1">
        {children}
      </div>
      {actionButton}
    </div>
  );
}
