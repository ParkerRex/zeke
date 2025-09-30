import { getUser } from "@zeke/supabase/cached-queries";
import { Skeleton } from "@zeke/ui/skeleton";
import { NotificationSetting } from "./notification-setting";

export function NotificationSettingsSkeleton() {
  return [...Array(2)].map((_, index) => (
    <Skeleton key={index.toString()} className="h-4 w-[25%] mb-3" />
  ));
}

export async function NotificationSettings() {
  const { data: userData } = await getUser();
  const subscriberPreferences = [
    {
      id: "insights-digest",
      name: "Insights Digest",
      preference: {
        channels: {
          in_app: true,
          email: false,
        },
      },
    },
    {
      id: "weekly-roundup",
      name: "Weekly Roundup",
      preference: {
        channels: {
          in_app: true,
          email: true,
        },
      },
    },
  ];

  const inAppSettings = subscriberPreferences.map((setting) => (
    <NotificationSetting
      key={setting.id}
      id={setting.id}
      name={setting.name}
      enabled={setting.preference.channels.in_app}
      subscriberId={userData.id}
      teamId={userData.team_id}
      type="in_app"
    />
  ));

  const emailSettings = subscriberPreferences.map((setting) => (
    <NotificationSetting
      key={`${setting.id}-email`}
      id={setting.id}
      name={setting.name}
      enabled={setting.preference.channels.email}
      subscriberId={userData.id}
      teamId={userData.team_id}
      type="email"
    />
  ));

  return (
    <div className="flex space-y-4 flex-col">
      <div>
        <h2 className="mb-2">In-App Notifications</h2>
        {inAppSettings}
      </div>

      <div>
        <h2 className="mb-2">Email Notifications</h2>
        {emailSettings}
      </div>
    </div>
  );
}
