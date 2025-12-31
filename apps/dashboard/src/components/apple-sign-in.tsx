"use client";

import { getUrl } from "@/utils/environment";
import { isDesktopApp } from "@zeke/desktop-client/platform";
import { authClient } from "@zeke/auth/client";
import { Icons } from "@zeke/ui/icons";
import { SubmitButton } from "@zeke/ui/submit-button";
import { useState } from "react";

export function AppleSignIn() {
  const [isLoading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);

    const callbackUrl = new URL("/api/auth/callback", getUrl());

    if (isDesktopApp()) {
      callbackUrl.searchParams.append("provider", "apple");
      callbackUrl.searchParams.append("client", "desktop");
    } else {
      callbackUrl.searchParams.append("provider", "apple");
    }

    await authClient.signIn.social({
      provider: "apple",
      callbackURL: callbackUrl.toString(),
    });

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <SubmitButton
      onClick={handleSignIn}
      className="bg-primary px-6 py-4 text-secondary font-medium h-[40px] w-full"
      isSubmitting={isLoading}
    >
      <div className="flex items-center space-x-2">
        <Icons.Apple />
        <span>Continue with Apple</span>
      </div>
    </SubmitButton>
  );
}
