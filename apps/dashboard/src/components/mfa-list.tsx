import { getI18n } from "@/locales/server";
import { getSession } from "@zeke/auth/server";
import { Skeleton } from "@zeke/ui/skeleton";
import { format } from "date-fns";
import { RemoveMFAButton } from "./remove-mfa-button";

export function MFAListSkeleton() {
  return (
    <div className="flex justify-between items-center h-[36px]">
      <Skeleton className="h-4 w-[200px]" />
    </div>
  );
}

export async function MFAList() {
  const session = await getSession();
  const t = await getI18n();

  // Check if user has 2FA enabled via session
  const hasTwoFactor = session?.user?.twoFactorEnabled ?? false;

  if (!hasTwoFactor) {
    return null;
  }

  // Show single entry for TOTP 2FA since Better Auth uses single TOTP
  return (
    <div className="flex justify-between items-center space-y-4">
      <div>
        <p className="text-sm">Two-factor authentication enabled</p>

        <p className="text-xs text-[#606060] mt-0.5">
          {t("mfa_status.verified")}
        </p>
      </div>

      <RemoveMFAButton factorId="totp" />
    </div>
  );
}
