import {
  IngestionHealth,
  NotificationBadge,
  QuickActions,
  SearchTrigger,
  TrialStatus,
} from "@/components/header-client";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "./mobile-menu";

/**
 * Header - Main header component consuming bootstrap data
 * Displays ingestion health, trial status, notifications, and quick actions
 */
export function Header() {
  return (
    <header className="md:m-0 z-50 px-6 md:border-b h-[70px] flex justify-between items-center desktop:sticky desktop:top-0 desktop:bg-background sticky md:static top-0 backdrop-filter backdrop-blur-xl md:backdrop-filter md:backdrop-blur-none dark:bg-[#121212] bg-[#fff] bg-opacity-70 desktop:rounded-t-[10px]">
      <div className="flex items-center gap-4">
        <MobileMenu />
        <IngestionHealth />
      </div>

      <div className="flex items-center gap-3">
        <QuickActions />
        <SearchTrigger />
      </div>

      <div className="flex items-center gap-2 ml-auto md:ml-0">
        <TrialStatus />
        <NotificationBadge />
        <UserMenu />
      </div>
    </header>
  );
}
