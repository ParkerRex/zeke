// Frontend notification definitions
export interface NotificationDisplayInfo {
  type: string;
  name: string;
  description: string;
}

// Helper function to get display info for a notification type
export function getNotificationDisplayInfo(
  type: string,
): NotificationDisplayInfo {
  // Fallback for all notification types - format the type name nicely
  return {
    type,
    name: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `Notifications for ${type.replace(/_/g, " ")}`,
  };
}

// Helper function to get category display title
export function getCategoryDisplayTitle(category: string): string {
  // Capitalize first letter and replace underscores with spaces
  return (
    category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ")
  );
}
