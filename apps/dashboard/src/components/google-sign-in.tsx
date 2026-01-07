"use client";

import { getUrl } from "@/utils/environment";
import { authClient } from "@zeke/auth/client";
import { Icons } from "@zeke/ui/icons";
import { SubmitButton } from "@zeke/ui/submit-button";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function GoogleSignIn() {
  const [isLoading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");

  const handleSignIn = async () => {
    setLoading(true);
    const safeReturnTo =
      returnTo && !returnTo.startsWith("api/") && !returnTo.startsWith("/api/")
        ? returnTo
        : null;

    const callbackUrl = new URL(safeReturnTo ?? "/", getUrl());
    await authClient.signIn.social({
      provider: "google",
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
        <Icons.Google />
        <span>Continue with Google</span>
      </div>
    </SubmitButton>
  );
}
