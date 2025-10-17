import type { useI18n } from "@/locales/client";
import { format } from "date-fns";

type UseI18nReturn = ReturnType<typeof useI18n>;

interface NotificationUser {
  locale?: string | null;
  dateFormat?: string | null;
}

interface NotificationMetadata {
  [key: string]: any;
}

type NotificationDescriptionHandler = (
  metadata: NotificationMetadata,
  user: NotificationUser | undefined,
  t: UseI18nReturn,
) => string;

const handleStoryPublished: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const storyTitle = metadata?.storyTitle || metadata?.title;
  const author = metadata?.author || metadata?.userName;

  if (storyTitle && author) {
    return `${author} published "${storyTitle}"`;
  }
  if (storyTitle) {
    return `New story published: "${storyTitle}"`;
  }
  return "A new story was published";
};

const handleStoryPinned: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const storyTitle = metadata?.storyTitle || metadata?.title;

  if (storyTitle) {
    return `Story pinned: "${storyTitle}"`;
  }
  return "A story was pinned";
};

const handleHighlightCreated: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const storyTitle = metadata?.storyTitle;
  const author = metadata?.author || metadata?.userName;
  const highlightText = metadata?.highlightText;

  if (storyTitle && author) {
    return `${author} created a highlight in "${storyTitle}"`;
  }
  if (highlightText) {
    const truncated =
      highlightText.length > 50
        ? `${highlightText.substring(0, 50)}...`
        : highlightText;
    return `New highlight: "${truncated}"`;
  }
  return "A new highlight was created";
};

const handleHighlightPinned: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const highlightText = metadata?.highlightText;

  if (highlightText) {
    const truncated =
      highlightText.length > 50
        ? `${highlightText.substring(0, 50)}...`
        : highlightText;
    return `Highlight pinned: "${truncated}"`;
  }
  return "A highlight was pinned";
};

const handlePlaybookCreated: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const playbookTitle = metadata?.playbookTitle || metadata?.title;
  const author = metadata?.author || metadata?.userName;

  if (playbookTitle && author) {
    return `${author} created playbook "${playbookTitle}"`;
  }
  if (playbookTitle) {
    return `New playbook created: "${playbookTitle}"`;
  }
  return "A new playbook was created";
};

const handlePlaybookPublished: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const playbookTitle = metadata?.playbookTitle || metadata?.title;
  const publishedAt = metadata?.publishedAt;

  if (playbookTitle && publishedAt) {
    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const publishedDate = new Date(publishedAt);
    const formattedDate = format(publishedDate, userDateFormat);

    return `Playbook "${playbookTitle}" published on ${formattedDate}`;
  }
  if (playbookTitle) {
    return `Playbook published: "${playbookTitle}"`;
  }
  return "A playbook was published";
};

const handleGoalCreated: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const goalTitle = metadata?.goalTitle || metadata?.title;
  const targetDate = metadata?.targetDate;

  if (goalTitle && targetDate) {
    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const target = new Date(targetDate);
    const formattedDate = format(target, userDateFormat);

    return `New goal created: "${goalTitle}" (target: ${formattedDate})`;
  }
  if (goalTitle) {
    return `New goal created: "${goalTitle}"`;
  }
  return "A new goal was created";
};

const handleGoalCompleted: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const goalTitle = metadata?.goalTitle || metadata?.title;
  const completedAt = metadata?.completedAt;

  if (goalTitle && completedAt) {
    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const completed = new Date(completedAt);
    const formattedDate = format(completed, userDateFormat);

    return `Goal completed: "${goalTitle}" on ${formattedDate}`;
  }
  if (goalTitle) {
    return `Goal completed: "${goalTitle}"`;
  }
  return "A goal was completed";
};

const handleSubscriptionUpgraded: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const plan = metadata?.plan;
  const features = metadata?.features;

  if (plan && features) {
    return `Subscription upgraded to ${plan} with: ${features.join(", ")}`;
  }
  if (plan) {
    return `Subscription upgraded to ${plan}`;
  }
  return "Your subscription was upgraded";
};

const handleSubscriptionDowngraded: NotificationDescriptionHandler = (
  metadata,
  user,
  t,
) => {
  const plan = metadata?.plan;
  const effectiveDate = metadata?.effectiveDate;

  if (plan && effectiveDate) {
    const userDateFormat = user?.dateFormat || "dd/MM/yyyy";
    const effective = new Date(effectiveDate);
    const formattedDate = format(effective, userDateFormat);

    return `Subscription downgraded to ${plan} (effective: ${formattedDate})`;
  }
  if (plan) {
    return `Subscription downgraded to ${plan}`;
  }
  return "Your subscription was downgraded";
};

const notificationHandlers: Record<string, NotificationDescriptionHandler> = {
  story_published: handleStoryPublished,
  story_pinned: handleStoryPinned,
  highlight_created: handleHighlightCreated,
  highlight_pinned: handleHighlightPinned,
  playbook_created: handlePlaybookCreated,
  playbook_published: handlePlaybookPublished,
  goal_created: handleGoalCreated,
  goal_completed: handleGoalCompleted,
  subscription_upgraded: handleSubscriptionUpgraded,
  subscription_downgraded: handleSubscriptionDowngraded,
};

export function getNotificationDescription(
  activityType: string,
  metadata: NotificationMetadata,
  user: NotificationUser | undefined,
  t: UseI18nReturn,
): string {
  const handler = notificationHandlers[activityType];
  if (handler) {
    return handler(metadata, user, t);
  }
  return "New notification";
}
