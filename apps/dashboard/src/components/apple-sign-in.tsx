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

    if (!isDesktopApp()) {
      const callbackUrl = new URL("/", getUrl());
      await authClient.signIn.social({
        provider: "apple",
        callbackURL: callbackUrl.toString(),
      });
      setTimeout(() => {
        setLoading(false);
      }, 2000);
      return;
    }

    const desktopCallbackUrl = new URL("/api/auth/callback", getUrl());
    desktopCallbackUrl.searchParams.append("provider", "apple");
    desktopCallbackUrl.searchParams.append("client", "desktop");
    await authClient.signIn.social({
      provider: "apple",
      callbackURL: desktopCallbackUrl.toString(),
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
